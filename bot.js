const puppeteer = require('puppeteer');
const fs = require('fs');

const commanderName = "ghave-guru-of-spores";
let deckNumber = 0;
let loopsTimeTally = 0;

/**
 * Makes the program halt for time ms (mostly for testing purposes)
 * @param {int} time : the time of the sleep in ms
 * @returns A Promise that will take time ms to realise
 */
function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

/**
 * Will save the json file created by the bot to the file system
 * @param {JSON} obj : the obj to save to the file system
 * @param {string} filename : the name we want to save this in
 */
const JSONToFile = (obj, filename) => {
    fs.writeFileSync(`${filename}.json`, JSON.stringify(obj, null, 2));
}

/**
 * Processing function of the bot. Will fetch the data of decks for the wanted commander, for future "analysis"
 * @param {int} numberOfNext : the number of time the "Next" button will be clicked on (aka the total number of decks seen will be 10 * numberOfNext)
 */
async function processing(numberOfDecksOnPage) {

    const numberDict = {
        10: "xpath=/html/body/div/main/div[1]/div[3]/div/div/div[1]/div/button[1]",
        25: "xpath=/html/body/div/main/div[1]/div[3]/div/div/div[1]/div/button[2]",
        50: "xpath=/html/body/div/main/div[1]/div[3]/div/div/div[1]/div/button[3]",
        100: "xpath=/html/body/div/main/div[1]/div[3]/div/div/div[1]/div/button[4]"
    }

    var keys = Object.keys(numberDict);


    console.log(keys);
    console.log(numberOfDecksOnPage);

    if ( !(keys.includes(numberOfDecksOnPage.toString(), 0))) {
        console.log(`Wrong number of decks. Must be a number in ${[10, 25, 50, 100]}. Remember to change the parameter of the function at the bottom of the code !`);
        return
    } else {
        console.log(`Searching for the first ${numberOfDecksOnPage} decks for the commander !`);
    }
    
    const botStart = Date.now();
    let cardLists = [];

    const browser = await puppeteer.launch({
        headless: false,
    });

    console.log("OPENED BROWSER");

    const page = await browser.newPage();
    page.setViewport({
        height: 1500, 
        width: 1500
    })

    await page.goto('https://edhrec.com/decks/' + commanderName, {
        waitUntil: ['networkidle2', 'load']
    });

    


    //Clicking on the cookies button
    await page.click("xpath=/html/body/div[2]/div/div[2]/div[3]/div/div[2]");

    await page.click(numberDict[numberOfDecksOnPage.toString()]);


    await page.waitForSelector('table');

    /**
     * The content of the table with the list of decks
     * 
     * @attribute tableData.headers = Headers of the table
     * @attribute tableData.data = Rows : link to the decklist and decklist info
     */
    const tableData = await page.evaluate(() => {

        var links = [];
        
        var table = document.querySelector('table');
        var rows = table.querySelectorAll('tr');

        const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
        
        data = Array.from(rows).slice(1).map(row => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).map(cell => {
                if (cell.firstChild && cell.firstChild.href) {
                    return cell.firstChild.href
                } else {
                    return cell.textContent.trim()
                }
            });
        })
        
        links = Array.from(data).map(ele => {
            return ele[0]
        });

        return {
            headers,
            data, 
            links
        };
    });

        
    console.log(tableData.links);

    
    // Goes through every deck in the home page and retrieves the decklist
    for (index in tableData.data) {

        const loopStart = Date.now();
        const row = tableData.data[index]

        await page.goto(row[0], {
            waitUntil: ['networkidle0']
        });

        deckNumber++;
        console.log("Deck n°" + deckNumber + " => Loaded");

        //Click on the Table View button
        await page.click('xpath=/html/body/div/main/div[1]/div[3]/div/div[1]/div[2]/div/div[2]/a');

        //Waiting for the table to show up
        await page.waitForSelector('#__next > main > div.w-100 > div.mvCardList > div > div.CardLists_body__kQlpk > div > div.react-bootstrap-table > table')

        //await page.waitForSelector("table");

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
        const loopEnd = Date.now();
        loopsTimeTally += (loopEnd - loopStart);

    }

    const botEnd = Date.now();

    //console.log(tableData.headers);
    //console.log(tableData.data[4]);
    //console.log(cardLists[4]);
    console.log(`Mean time to process a decklist: ${loopsTimeTally === 0 ? 0 : loopsTimeTally/deckNumber} ms`);
    console.log(`Total process time : ${botEnd - botStart} ms`);

    // TODO : go to next page X times by going back to decks and clicking on the Next button

    
    // Save in json format, as a file name after the commander name
    var collection = {
        decklists : []
    };

    for (index in tableData.data) {
        collection.decklists.push({
            list : cardLists[index],
            creatureNumber : parseInt(tableData.data[index][5]),
            instantNumber : parseInt(tableData.data[index][6]),
            sorceryNumber : parseInt(tableData.data[index][7]),
            artifactNumber : parseInt(tableData.data[index][8]),
            enchantNumber : parseInt(tableData.data[index][9]),
            planeswalkerNumber : parseInt(tableData.data[index][10]),
        })
    };

    JSONToFile(collection, commanderName);

    await browser.close();

    
};

processing(25);