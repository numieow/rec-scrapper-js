const puppeteer = require('puppeteer');

const commanderName = "ghave-guru-of-spores"

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

(async () => {

    const browser = await puppeteer.launch({
        headless: false,
    });

    const page = await browser.newPage();
    page.setViewport({
        height: 1500, 
        width: 1500
    })

    await page.goto('https://edhrec.com/decks/' + commanderName, {
        waitUntil: 'networkidle0'
    })

    // TODO : Get all decklist tags in the page

    await page.waitForSelector('table');

    /**
     * Get the content of the table with the list of decks
     */
    const tableData = await page.evaluate(() => {

        const table = document.querySelector('table');
        const rows = table.querySelectorAll('tr');
        
        const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());

        const data = Array.from(rows).slice(1).map(row => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).map(cell => {
                if (cell.firstChild && cell.firstChild.href) {
                    return cell.firstChild.href
                } else {
                    return cell.textContent.trim()
                }
            });
        })

        return {
            headers,
            data
        };

    });

    console.log('Table headers:', tableData.headers)
    console.log('Table content:', tableData.data)
    

    // TODO : Go through all of them and get the decklist
    
    
    // TODO : go to next page X times


    // TODO : save in json format

    await sleep(25000);


    await browser.close();
})();