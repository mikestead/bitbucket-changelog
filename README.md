# Bitbucket Changelog

Maintain a changelog of merged pull requests to master branch since 
the last release. Can be integrated into your automated release cycle.

Includes child pull requests from those that went into master, so if you
run feature branches which have story/fix branches off them, these will be listed too.

##### Currently supports Bitbucket Server, _not Cloud_.

### Installation

	npm install bitbucket-changelog -g

### Usage

__Requires Node 4+__

You can pass your credentials via env variables

	BITBUCKET_USER=username BITBUCKET_PSWD=password bbgenlog

This command should be run _after_ a version bump has been made to the `package.json`
but _before_ you tag your release.

The `package.json` will be read for the version to associate merged pull requests
since the last release.

You should also add some configuration to your `package.json` as shown below.

##### Example package.json

	{
		"version": "2.1.1"
		...
		"changelog": {
            "jira": "https://<your-jira-host>",
            "bitbucket": "https://<your-bitbucket-host>",
            "projectKey": "<bitbucket-project-key>",
            "repositoryKey": "<bitbucket-repository-key>"
        }
    }

	
By default this will only generate and add the pull requests merged since your last release.

If you want to generate the entire changelog add the `--overwrite` parameter. 

	BITBUCKET_USER=username BITBUCKET_PSWD=password bbgenlog --overwrite

_Remember this will overwrite the entire contents of the file._

If running yourself you can launch in interactive mode, which will prompt for credentials.

	bbgenlog --i

For help
	
    bbgenlog --help

    > Usage: bbgenlog [options]
    > 
    > Options:
    > 
    >   -h, --help           output usage information
    >   -o, --overwrite      regenerate the full changelog. OVERWRITES the current changelog
    >   -b, --branch [name]  base branch to look for merged pull requests (default: master)
    >   -i, --interactive    request username / password if not provided
