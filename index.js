const core = require('@actions/core')
const github = require('@actions/github')
const fs = require( 'fs' )

const checkFileExist = async (filePath) => {
    try {
        await fs.promises.access(filePath)
        core.notice(`File ${filePath} exists`)
        return true
    } catch (error) {
        core.setFailed(`File ${filePath} does not exist`)
        return false
    }
}

const openJsonFile = (filePath) => {
    try {
        const data = fs.readFileSync(filePath)
        return JSON.parse(data)
    } catch (error) {
        core.setFailed(`File ${filePath} does not exist`)
        return false
    }
}

(
    async () => {
        try {
            core.notice('=> Calling Deuna Test Enviroment Action')
            console.log(`Filename is ${__filename}`);
            console.log(`Directory name is ${__dirname}`);

            const requireConfigFilesData = openJsonFile(`${__dirname}/config/files.json`)
            for(const file of requireConfigFilesData) {
                checkFileExist(file)
            }

            const localRepositoriesConfigData = openJsonFile(`${__dirname}/config/repositories.json`)
            const currentRepositoriesConfigData = openJsonFile('github_action_config.json')

            const obj = Object.assign(localRepositoriesConfigData, currentRepositoriesConfigData)
            console.log(obj)

            // `who-to-greet` input defined in action metadata file
            //const nameToGreet = core.getInput('who-to-greet');
            //console.log(`Hello ${nameToGreet}!`);
            //const time = (new Date()).toTimeString();
            //core.setOutput("time", time);
            //// Get the JSON webhook payload for the event that triggered the workflow
            //const payload = JSON.stringify(github.context.payload, undefined, 2)
            //console.log(`The event payload: ${payload}`);
          } catch (error) {
            core.setFailed(error.message)
          }
    }

)()