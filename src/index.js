import http from 'http';
import fs from 'fs/promises';
import { addCat, readCats, getCatById, editCat } from './catService.js';
import { addBreed, readBreeds } from './breedService.js';

const server = http.createServer(async (req, res) => {
    console.log(readCats());
    if (req.method === 'POST' && req.url === '/cats/add-breed') {
        const bodyFormData = await readBodyFormData(req);
        const breedName = bodyFormData.get('breed');
        addBreed(breedName);

    //Redirect to the home page after adding the breed
    return res.writeHead(302, { 'Location': '/' }).end();

    }

    if (req.method === 'POST' && req.url === '/cats/add-cat') {
            const bodyFormData = await readBodyFormData(req);
            const newCat = {
                name: bodyFormData.get('name'),
                breed: bodyFormData.get('breed'),
                description: bodyFormData.get('description'),
                imageUrl: bodyFormData.get('imageUrl')
            };

            addCat(newCat);

            return res.writeHead(302, { 'Location': '/' }).end();
        }

    if(req.method === 'POST' && req.url.startsWith('/cats/edit-cat/')) {
        const catId = req.url.split('/').pop();
        const bodyFormData = await readBodyFormData(req);

        editCat(catId, Object.fromEntries(bodyFormData.entries()));

        return res.writeHead(302, { 'Location': '/' }).end();
    }

    if (req.url === '/styles/site.css') {
        const cssContent = await fs.readFile('./src/styles/site.css', 'utf-8');

        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.write(cssContent);

        return res.end();
    }

    if (req.url === '/js/script.js') {
        const jsContent = await fs.readFile('./src/js/script.js', 'utf-8');

        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.write(jsContent);

        return res.end();
    }

    let htmlContent = '';
    res.writeHead(200, { 'Content-Type': 'text/html' });

    if(req.url === '/') {
        htmlContent = await renderHomePage();
    } else if(req.url === '/cats/add-breed') {
        htmlContent = await fs.readFile('./src/views/addBreed.html', 'utf-8');
    } else if(req.url === '/cats/add-cat') {
        htmlContent = await renderAddCatPage();
    } else if(req.url.startsWith('/cats/edit-cat/')) {
        const catId = req.url.split('/').pop();
        htmlContent = await renderEditCatPage(catId);
    } else {
        htmlContent = await renderNotFoundPage();
    }

    res.write(htmlContent);

    res.end();
});

async function renderHomePage() {
    const htmlContent = await fs.readFile('./src/views/home/index.html', 'utf-8');

    const catTemplate = (cat) => `
    
      <li>
                    <img src="${cat.imageUrl}" alt="${cat.name}">
                    <h3>${cat.name}</h3>
                    <p><span>Breed: </span>${cat.breed}</p>
                    <p><span>Description: </span>${cat.description}</p>
                    <ul class="buttons">
                        <li class="btn edit"><a href="/cats/edit-cat/${cat.id}">Change Info</a></li>
                        <li class="btn delete"><a href="">New Home</a></li>
                    </ul>
        </li>
    `;

    const cats = await readCats();
    const catsContent = `<ul>${cats.map(cat => catTemplate(cat)).join('\n')}</ul>`;

    const result = htmlContent.replace('{{cats}}', catsContent);

    return result;
}

async function renderAddCatPage() {
    const htmlContent = await fs.readFile('./src/views/addCat.html', 'utf-8');
   
    const result = htmlContent.replace('{{breedOptions}}', renderBreedOptions());

    return result;
}

async function renderEditCatPage(catId) {
    const cat = getCatById(catId);
    console.log(cat);

    if(!cat) {
        return renderNotFoundPage();
    }
    const htmlContent = await fs.readFile('./src/views/editCat.html', 'utf-8');
    const result = htmlContent
    .replace('{{name}}', cat.name)
    .replace('{{description}}', cat.description)
    .replace('{{imageUrl}}', cat.imageUrl)
    .replace('{{breedOptions}}', renderBreedOptions(cat.breed));

    return result;
}

function renderBreedOptions(selectedBreed) {
    const breeds = readBreeds();

    return breeds.map(breed => `<option value="${breed.id}"${breed.name === selectedBreed ? ' selected' : ''}>${breed.name}</option>`).join('\n');
}

async function renderNotFoundPage() {
    return fs.readFile('./src/views/notFound.html', 'utf-8');
}

function readBodyFormData(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
        });

        req.on('end', () => {
            const formData = new URLSearchParams(body);
            resolve(formData);
        });

    });
}

server.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000');
});