#!/usr/bin/env node
'use strict'

const request = require('axios')
const path = require('path')
const uri = require('lil-uri')
const fs = require('fs')
const program = require('commander')
const prompt = require('co-prompt')
const co = require('co')

let username, password, baseUrl

program
	.arguments('<version> <username> [host] [key] [slug] [changes-path]')
	.option('-o, --overwrite', 'Regenerate the full changelog. This will overwrite the current changelog')
	.action((version, user, host, key, slug, out) => {
		co(function *() {
			username = user

			const info = getRepoInfo()
			if (!host) host = info.host
			if (!key) key = info.key
			if (!slug) slug = info.slug
			out = out ? path.resolve(out) : path.resolve('CHANGES.md')

			password = yield prompt.password('password: ')
			baseUrl = `https://${host}/rest/api/1.0/projects/${key}/repos/${slug}`

			let prs
			const tags = yield getTags()
			if (tags.values.length && !program.overwrite) {
				const lastTag = tags.values[0]
				lastTag.commit = yield getCommit(lastTag.hash)
				prs = yield getPullRequests('master', 'MERGED', lastTag.commit.authorTimestamp, 0, 25)
			} else {
				const all = tags.map(tag => getCommit(tag.hash))
				const results = yield Promise.all(all)
				results.forEach((commit, i) => tags[i].commit = commit)
				prs = yield getPullRequests('master', 'MERGED', null, 0, 50)
			}

			const releases = getReleases(tags, prs, version)

			const all = prs.map(pr => getPullRequests(pr.fromRef.displayId, 'MERGED', null, 0, 25))
			const results = yield Promise.all(all)
			results.forEach((children, i) => prs[i].children = children)

			//render(releases, out, program.overwrite)
		})
	})
	.parse(process.argv)

function getRepoInfo() {
	try {
		const gitConfig = fs.readFileSync(path.resolve('.git/config'), 'utf8')
		const match = gitConfig.match(/(https:|ssh:).+\.git$/m)
		const url = uri(match[0])
		let host = url.host()
		if (host.endsWith(':')) host = host.substr(0, host.length - 1)
		const parts = url.path().split('/')
		const slug = path.basename(parts.pop(), '.git')
		const key = parts.pop()
		return {host, key, slug}
	}
	catch(e) { }
	return {}
}
function getPullRequests(branch, state, since, start, size, results) {
	return getPullRequestsPage(branch, state, start, size).then(res => {
		let prs = res.values
		if (since) {
			prs = prs.filter(pr => pr.updatedDate > since)
		}
		results = (results || []).concat(prs)
		if (res.isLastPage || prs.length < res.values.length) {
			return results.filter(pr => pr.toRef.id === `refs/heads/${branch}`)
		} else {
			return getPullRequests(branch, state, since, start + size, size, results)
		}
	})
}

function getPullRequestsPage(branch, state, start, size) {
	return serviceCall(`${baseUrl}/pull-requests?state=${state}&order=NEWEST&at=refs/heads/${branch}&start=${start}&limit=${size}`)
}

function getTags() {
	return serviceCall(`${baseUrl}/tags`)
}

function getCommit(hash) {
	return serviceCall(`${baseUrl}/commits/${hash}`)
}

function serviceCall(url) {
	console.log(url)
	return request({
		url,
		headers: {
			accept: 'application/json'
		},
		auth: {
			username,
			password
		},
		responseType: 'json'
	})
	.then(res => res.data)
}

function getReleases(tags, prs, version) {

}

function render(releases, out, overwrite) {

}

function exit(res) {
	console.error(`${res.status}: ${res.statusText} - ${res.data}`);
	process.exist(1)
}
