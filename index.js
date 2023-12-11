const express = require('express');
const { exec } = require('child_process');
//const puppeteer = require('puppeteer');
const app = express();
app.use(express.static('./public'))

function parseSTDOUT(stdout) {
    let json = JSON.parse(stdout)

    let workspaces = {}

    for (var e in json) {
        e = json[e]
        id = e["workspace"]["id"]
        if (id == '-1') continue
        workspaces[id]
        let classTitle = {
            class: e["class"],
            title: e["title"],
            initialClass: e["initialClass"],
            initialTitle: e["initialTitle"]
        };
        //console.log(classTitle)
        if (classTitle.class == 'Chromium' && classTitle.initialTitle == 'localhost_/') continue
        if (workspaces.hasOwnProperty(id)) {
            workspaces[id].push(classTitle);
        } else {
            workspaces[id] = [classTitle];
        }
    }
    return workspaces
}

function reduceWorkspaces(workspaces) {
    return (res, k) => {
        res += `
        <a href="workspace?n=${k}">
            <div class="grid-item">
            <p class="workspaceNumber">workspace ${k}</p>
                <div class="grid-container-inner">
                    ${workspaces[k].reduce(reduceWindows, ``)}
                </div>
            </div>
        </a>
        `
        return res
    }
}

function reduceWindows(res, e) {
    res += `
    <div class="grid-item-inner">
        <p class="classClient">${e["class"]}</p>
        <p class="titleClient">${e["title"]}</p>
    </div>
    `
    return res
}

function page(body) {
    return `
    <html>
        <head>
            <title>expose</title>
            <link rel="stylesheet" href="style.css" />
        </head>
        <body>
        <div class="overlay"></div>
            <div class="grid-container">
                ${body}
            </div>
        </body>
    </html>
    `
}


app.get('/', async (req, res) => {
    exec('hyprctl -j clients', (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }

        workspaces = parseSTDOUT(stdout)

        body = Object.keys(workspaces).sort().reduce(reduceWorkspaces(workspaces), ``)

        res.send(page(body));

    });
});

app.get('/workspace', async (req, res) => {
    await exec(`hyprctl dispatch movetoworkspace ${req.query.n}`)
    await exec(`hyprctl dispatch killactive`)
})

app.listen(3100, async () => {
    /*
    const browser = await puppeteer.launch({
        headless: false,
        args: [`--app=http://localhost:3100`],
        ignoreDefaultArgs: ['--enable-automation']
    });
    // Quit Node.js when the browser window is closed
    browser.on('disconnected', () => {
        process.exit();
    });
    */
});
