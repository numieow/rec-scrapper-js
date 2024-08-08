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
        waitUntil: 'networkidle2'
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

    //console.log('Table headers:', tableData.headers)
    //console.log('Table content:', tableData.data[0])
    

    // TODO : Go through all of them and get the decklist

    let cardLists = [];

    console.log("On entre");

    for (index in tableData.data) {
        const row = tableData.data[index]

        await page.goto(row[0], {
            waitUntil: 'load'
        })

        await page.click('xpath=/html/body/div/main/div[1]/div[3]/div/div[1]/div[2]/div/div[2]/a')

        await sleep(10000);

        const gridData = await page.evaluate(() => {
            
            /*
            const cards = document.querySelectorAll('.CardImage_container__4_PKo');

            return Array.from(cards).map(card => card.firstChild.firstChild.alt);*/

        })

        cardLists.push(gridData);

    }

    console.log(cardLists)
    
    // TODO : go to next page X times


    // TODO : save in json format

    await browser.close();
})();