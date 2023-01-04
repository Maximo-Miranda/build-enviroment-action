const core = require('@actions/core')
const github = require('@actions/github')
const fs = require('fs')
const _ = require('lodash')
const shell = require('shelljs')
const GitUrlParse = require("git-url-parse");

// checkFileExist ...
const checkFileExist = async (filePath) => {
    try {
        await fs.promises.access(filePath)
        core.notice(`File ${filePath} exists`)
        return true
    } catch (error) {
        throw new Error(`File ${filePath} does not exist`)
    }
}

// checkExistPath ...
const checkExistPath = async (path) => {
    try {
        if (await fs.promises.existsSync(path)) {
            return true
        }
        return false
    } catch (error) {
        throw error
    }
}

// openJsonFile ...
const openJsonFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath)
        return JSON.parse(data)
    } catch (error) {
        throw error
    }
}

// cloneRepository ...
const cloneRepository = (url, branch, name) => {
    try {
        //console.log(shell.pwd())
        const response = shell.exec(`git clone ${url} ${name} -b ${branch}`)
        if (response.code !== 0) {
            throw new Error(`${response.stderr.replaceAll('\n', '')}`)
        }
    } catch (error) {
        throw error
    }
}

// Merge arrays by keys condition ...
const mergeJsonArrayByKeyCondition = (from, to, key) => {

    const tmp = []

    for (const element of to) {
        const find = _.findIndex(from, (o) => _.isEqual(o, element))
        if (find >= 0) {
            tmp.push(from[find])
        } else {
            tmp.push(element)
        }
    }

    return tmp

    //const tmpConcat = _.concat(first, second)
    //const tmpSortedUniq = _.uniqWith(tmpConcat, _.isEqual)
    //
    //return tmpSortedUniq
}


const makeGithubUrl = (url) => {

}

(
    async () => {
        try {

            const GITHUB_TOKEN = process.env.PERSONAL_TOKEN
            const DEUNA_ACTION_ENVIRONMENT = process.env.DEUNA_ACTION_ENVIRONMENT
            let USERNAME = ''

            core.notice('=> Calling Deuna Test Enviroment Action')

            const requireConfigFilesData = openJsonFile(`${__dirname}/config/files.json`)
            for (const file of requireConfigFilesData) {
                checkFileExist(file)
            }

            const localRepositoriesConfigData = openJsonFile(`${__dirname}/config/repositories.json`)
            const currentRepositoriesConfigData = openJsonFile('github_action_config.json')

            const repositories = mergeJsonArrayByKeyCondition(localRepositoriesConfigData, currentRepositoriesConfigData)

            if(obj.length === 0) {
                throw new Error('No repositories to clone')
            }

            console.log("obj", repositories)

            for (const repository of repositories) {
                cloneRepository(repository.url, repository.branch, repository.name)
            }


            if (shell.which('docker-compose')) {
                shell.echo('Docker Compose is installed');
            } else {
                shell.echo('Docker Compose is not installed');
            }

            // `who-to-greet` input defined in action metadata file
            //const nameToGreet = core.getInput('who-to-greet');
            //console.log(`Hello ${nameToGreet}!`);
            //const time = (new Date()).toTimeString();
            //core.setOutput("time", time);
            //// Get the JSON webhook payload for the event that triggered the workflow
            const payload = JSON.stringify(github.context.payload, undefined, 2)
            console.log(`The event payload: ${payload}`);

        } catch (error) {
            core.setFailed(error.message)
        }
    }

)()