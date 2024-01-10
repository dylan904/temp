import { promisify } from 'util'
import { exec } from 'child_process'

class Git {
    async init() {  // optional
        if (!(await this.isRepo())) {
            throw('Not a git repository (yet). Try running "git init"')
        }
        else if (!(await this.hasCommits())) {
            await this.exec('git commit --allow-empty -n -m "Initial commit."')
        }
    }

    async isRepo() {
        const { result } = await this.tryExec(`git rev-parse --is-inside-work-tree`)
        return result.trim() === 'true'
    }

    async hasCommits() {
        const { result } = await this.tryExec(`git log`)
        return !!result.trim()
    }

    async isFileTracked(filePath) {
        const { result: trackedChanges } = await this.tryExec(`git ls-files ${filePath}`)
        return !!trackedChanges
    }

    async fileHasChanges(filePath, staged) {  // changes relative to working directory, compared to last commit (HEAD)
        const flags = staged ? '--staged' : ''
        const { result: changes } = await this.tryExec(`git diff ${flags} ${filePath}`)
        return !!changes
    }

    async add(filePath) {
        await this.tryExec(`git add ${filePath}`)
    }

    async getUntrackedFiles() {
        const { result: rawUntrackedFiles } = await this.tryExec('git status --porcelain | grep "^??"')
        const untrackedFiles = rawUntrackedFiles.split('??').map(file => file.trim())
        untrackedFiles.shift()
        return untrackedFiles
    }

    async commitFiles(filePaths, message="File tracking commit", flags=[], ignoreUntracked=false) {
        if (filePaths.length) {
            for (const filePath of filePaths) {
                await this.add(filePath)
            }
            const args = [`-m "${message}"`, ...flags]
            try {
                await this.exec(`git commit ${ args.join(' ') }`)
            } catch(commitErr) {
                if (ignoreUntracked) {
                    const untrackedFiles = await this.getUntrackedFiles()
                    console.log({ untrackedFiles })
                }
            }
            const { result: commitHash } = await this.tryExec(`git rev-parse HEAD`)
            return commitHash.trim()
        }
        return null
    }

    async getFileCommitHash(filePath) { // assumes you're on correct branch
        const { result: commitHash } = await this.tryExec(`git rev-list -1 HEAD -- ${filePath}`)
        return commitHash.trim()
    }

    async fileDiffersFromCommit(filePath, commitHash, compareToHead=false) {  // changes relative to current state or last commit (HEAD), compared to a specific commit hash
        const cmd = compareToHead ? `git diff ${commitHash}..HEAD -- ${filePath}` : `git diff ${commitHash} -- ${filePath}`
        const { result: changes } = await this.tryExec(cmd)
        return !!changes.trim()
    }

    async fileExists(filePath) {
        const { result: existingFilePath } = await this.tryExec(`git ls-files ${filePath}`)
        return !!existingFilePath.trim()
    }

    async branchExists(branchName) {
        const { result: existingBranchName } = await this.tryExec(`git rev-parse --verify ${branchName}`)
        return !!existingBranchName.trim()
    }

    async getCurrentBranch() {
        const { result: currentBranchName } = await this.tryExec(`git rev-parse --abbrev-ref HEAD`)
        return currentBranchName.trim()
    }

    async createBranch(branchName) {
        return await this.tryExec(`git checkout -b ${branchName}`)
    }

    async checkoutBranch(branchName) {
        return await this.exec(`git checkout ${branchName}`)
    }

    async forcefullyCheckoutBranch(branchName) {
        const currentBranch = await this.getCurrentBranch() // hold current branch name
  
        if (!(await this.branchExists(branchName)))
            await this.createBranch(branchName)
        else
            await this.checkoutBranch(branchName)


        return currentBranch
    }

    async checkoutFileFromBranch(filePath, branchName) {
        return await this.tryExec(`git checkout ${branchName} -- ${filePath}`)
    }

    async stash() {
        await this.tryExec(`git stash push -m "a11y git.js stash"`)
    }
    
    async popStash(n=0, retry) {
        try {
            await this.tryExec(`git stash pop stash@{${n}}`)
        }
        catch(err) {
            console.log('itried - ' + err)
            if (!retry && err.includes('files would be overwritten')) {
                this.add('.')
                this.popStash(n, true)
            }
        }
    }

    async getConfigProp(prop) {
        const { result } = await this.tryExec(`git config ${prop}`)
        return result.trim()
    }

    async tryExec(command) {
        try {
            const { stdout } = await this.exec(command)
            return { result: stdout }
        } catch(error) {
            console.warn(error)
            return { error }
        }
    }
}

Git.prototype.exec = promisify(exec)
  



init()

async function init() {
    const git = new Git()

    await git.popStash()
}