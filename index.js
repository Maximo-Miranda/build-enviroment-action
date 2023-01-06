const core = require('@actions/core')
const github = require('@actions/github')
const fs = require('fs')
const _ = require('lodash')
const shell = require('shelljs')
const GitUrlParse = require("git-url-parse");
const axios = require('axios').default;
const newman = require('newman');

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

// createDirectory ...
const createDirectory = async (path) => {
    try {

        const pathCreated = await fs.promises.mkdir(path, { recursive: true })
        return pathCreated

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
const cloneRepository = (url, branch, name, path) => {
    try {
        //console.log(shell.pwd())
        console.log("=> init clone repository", url, branch, path)
        const response = shell.exec(`git clone ${url} ${path}/${name} -b ${branch}`)
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
}


const makeGithubUrl = (url, username, token) => {
    const urlParse = GitUrlParse(url)
    return `https://${username}:${token}@${urlParse.resource}/${urlParse.pathname}`
}

(
    async () => {
        try {

            const payload = JSON.stringify(github.context.payload, undefined, 2)

            const GITHUB_TOKEN = process.env.PERSONAL_TOKEN
            const DEUNA_ACTION_ENVIRONMENT = process.env.DEUNA_ACTION_ENVIRONMENT
            //let USERNAME = payload.head_commit.author.username
            //console.log("payload", payload)
            let USERNAME = "Maximo-Miranda"

            core.notice('=> Calling Deuna Test Enviroment Action')

            const requireConfigFilesData = openJsonFile(`${__dirname}/config/files.json`)
            for (const file of requireConfigFilesData) {
                checkFileExist(file)
            }

            const localRepositoriesConfigData = openJsonFile(`${__dirname}/config/repositories.json`)
            const currentRepositoriesConfigData = openJsonFile('github_action_config.json')

            const repositories = mergeJsonArrayByKeyCondition(localRepositoriesConfigData, currentRepositoriesConfigData)

            if (repositories.length === 0) {
                throw new Error('No repositories to clone')
            }

            console.log("obj", repositories)

            const githubActionTmpServices = `${__dirname}/github_action_tmp_services`

            await createDirectory(githubActionTmpServices)

            for (const repository of repositories) {
                const url = makeGithubUrl(repository.url, USERNAME, GITHUB_TOKEN)
                cloneRepository(url, repository.branch, repository.name, githubActionTmpServices)
            }

            shell.ls('-R', githubActionTmpServices)

            if (shell.which('docker-compose')) {
                shell.echo('Docker Compose is installed');
                shell.exec(`docker-compose -f ${__dirname}/docker-compose.yml up -d`)
            } else {
                shell.echo('Docker Compose is not installed');
            }

            //axios('http://localhost:8001').then(function (response) {
            //    // handle success
            //    console.log(response);
            //}).catch(function (error) {
            //    // handle error
            //    console.log(error);
            //})

            //newman.run({
            //    collection: require(`${__dirname}/newman/Deuna-Dev.postman_collection.json`),
            //    reporters: 'cli'
            //}, function (err, summary) {
            //    console.log("err", err, summary)
            //    if (err) { throw err; }
            //    console.log('collection run complete!');
            //});

            //newman.run(
            //    {
            //        collection: require(`${__dirname}/newman/Deuna-Dev.postman_collection.json`),
            //        reporters: "@reportportal/agent-js-postman",
            //        reporter: {
            //            "@reportportal/agent-js-postman": {
            //                endpoint: "http://api:8080/ping",
            //                token: "00000000-0000-0000-0000-000000000000",
            //                //launch: "LAUNCH_NAME",
            //                //project: "PROJECT_NAME",
            //                description: "LAUNCH_DESCRIPTION",
            //                attributes: [],
            //                mode: 'DEFAULT',
            //                debug: true
            //            }
            //        }
            //    },
            //    function(err) {
            //        console.log("err", err)
            //        if (err) {
            //            throw err;
            //        }
            //        console.log("collection run complete!");
            //    }
            //);

            newman.run({
                collection: require(`${__dirname}/newman/Deuna-Dev.postman_collection.json`),
                reporters: ['json', 'cli'],
                reporter: { json: { export : `${__dirname}/newman/Deuna-Dev.postman_collection_reporter.json`}},
            }).on('start', function (err, args) { // on start of run, log to console
                console.log('running a collection...');
            }).on('exception', function (err) {
                console.log("EXCEPTION =>", err)
            }).on('done', function (err, summary) {
                console.log("ERROR, SUMMARY =>", err, summary)
                if (err || summary.error) {
                    console.error('collection run encountered an error.');
                }
                else {
                    console.log('collection run completed.');
                }
            })

            shell.exec(`ls ${__dirname}/newman`)

            // `who-to-greet` input defined in action metadata file
            //const nameToGreet = core.getInput('who-to-greet');
            //console.log(`Hello ${nameToGreet}!`);
            //const time = (new Date()).toTimeString();
            //core.setOutput("time", time);
            //// Get the JSON webhook payload for the event that triggered the workflow


        } catch (error) {
            core.setFailed(error.message)
        }
    }

)()