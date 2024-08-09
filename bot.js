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
    });


    //Clicking on the cookies button
    await page.click("xpath=/html/body/div[2]/div/div[2]/div[3]/div/div[2]");

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

    for (index in tableData.data) {
        const row = tableData.data[index]

        await page.goto(row[0], {
            waitUntil: ['load', 'networkidle2']
        });

        console.log(index + " => Loaded");

        //Click on the Table View button
        await page.click('xpath=/html/body/div/main/div[1]/div[3]/div/div[1]/div[2]/div/div[2]/a');

        //Waiting for the table to show up
        await page.waitForSelector('#__next > main > div.w-100 > div.mvCardList > div > div.CardLists_body__kQlpk > div > div.react-bootstrap-table > table')

        //await page.waitForSelector("table");
        console.log("YOOOO");

        const gridData = await page.evaluate(() => {
            
            const cardTable = document.querySelector('html body div#__next main.d-flex.flex-grow-1.p-3.pe-lg-0 div.w-100 div.mvCardList div.CardLists_container__Z8WYp.shadow-sm.card div.CardLists_body__kQlpk div.TableView_table__OBAzB div.react-bootstrap-table table.table.table-hover.table-bordered');
            
            const cardRows = cardTable.querySelectorAll('tr');
            //const cardHeaders = Array.from(cardRows[0].querySelectorAll('th')).map(th => th.textContent.trim());

            const decklist = Array.from(cardRows).slice(1).map(row => {
                const cells = row.querySelectorAll('td');
                return Array.from(cells).map(cell => {
                    if (cell.cellIndex == 3) {
                        return cell.firstChild.textContent;
                    }
                });
            });

            return decklist.flat().filter((ele) => typeof ele === "string");

        })

        cardLists.push(gridData);

    }

    console.log(cardLists[0]);
    
    // TODO : go to next page X times


    // TODO : save in json format

    await browser.close();
})();