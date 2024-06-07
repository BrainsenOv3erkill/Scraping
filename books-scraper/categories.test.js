const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const { Parser } = require('json2csv');

let driver;

beforeAll(async () => {
  driver = await new Builder().forBrowser('chrome').build();
}, 30000);

afterAll(async () => {
  await driver.quit();
}, 30000);

const categories = [
  { name: 'Philosophy', url: 'https://books.toscrape.com/catalogue/category/books/philosophy_7/index.html', file: 'philosophy.csv' },
  { name: 'Art', url: 'https://books.toscrape.com/catalogue/category/books/art_25/index.html', file: 'art.csv' },
  { name: 'Erotica', url: 'https://books.toscrape.com/catalogue/category/books/erotica_50/index.html', file: 'erotica.csv' }
];

async function scrapeCategory(category) {
  await driver.get(category.url);

  await driver.wait(until.elementLocated(By.css('.product_pod')), 10000);

  const bookElements = await driver.findElements(By.css('.product_pod'));

  let books = [];

  for (let bookElement of bookElements) {
    const titleElement = await bookElement.findElement(By.css('h3 a'));
    const title = await titleElement.getAttribute('title');
    const priceElement = await bookElement.findElement(By.css('.price_color'));
    const price = await priceElement.getText();
    const availabilityElement = await bookElement.findElement(By.css('.availability'));
    const availability = await availabilityElement.getText();

    
    await titleElement.click();
    await driver.wait(until.elementLocated(By.css('.product_page')), 10000);

    const descriptionElement = await driver.findElement(By.css('#product_description'));
    const description = await descriptionElement.getText();

    const imageElement = await driver.findElement(By.css('.item img'));
    const imageUrl = await imageElement.getAttribute('src');

    
    await driver.navigate().back();
    await driver.wait(until.elementLocated(By.css('.product_pod')), 10000);

    books.push({ title, price, availability, description, imageUrl });
  }

  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(books);
  fs.writeFileSync(category.file, csv);

  console.log(`Collected books from ${category.name}:`, books);
}

test('Drei Kategorien scrapen', async () => {
  for (const category of categories) {
    await scrapeCategory(category);
  }

  for (const category of categories) {
    const fileContent = fs.readFileSync(category.file, 'utf8');
    const lines = fileContent.split('\n');
    expect(lines.length).toBeGreaterThan(1);
    console.log(`Checked ${category.file} successfully`);
  }
}, 30000);
