### CONTRIBUTING TO THE Entity Value Aggregate REST API Server IN NODE.JS

#### TABLE OF CONTENTS

- [Getting the Code](#getting-the-code)
- [Configuring the IDE](#configuring-the-ide)
    - [Installing VSCode](#installing-vscode)
    - [Adding Extensions](#adding-extensions)
- [Setting up the Environment](#setting-up-the-environment)
    - [Generating the GPG key](#generating-the-gpg-key)
    - [Git Configuration](#setting-up-git-config-locally)
    - [Git Split Diff](#setting-up-git-split-diff)
- [Setting up third-party servers](#setting-up-third-party-servers)
    - [Installing Node.js](#installing-nodejs)
    - [Installing MongoDB](#installing-mongodb)
    - [Installing PostgreSQL](#installing-postgresql)
    - [Installing Redis](#installing-redis)
- [Configuring third-party servers](#configuring-third-party-servers)
    - [Configuring PostgreSQL](#configuring-postgresql)
    - [Configuring Redis](#configuring-redis)
- [Getting ready to run](#getting-ready-to-run)
    - [Installing required dependencies](#installing-required-dependencies)
    - [Setting up the database schema and seed data](#setting-up-the-database-schema-and-seed-data)
- [Running the Server](#running-the-server)

#### GETTING THE CODE

```bash
git clone https://github.com/twyr/entity-value-aggregate-server entity-value-aggregate-server
```

#### CONFIGURING THE IDE

##### Installing VSCode

Instructions for installing the latest version of VSCode on Debian / Ubuntu
based systems can be found here: [Installing VSCode on Linux](https://code.visualstudio.com/docs/setup/linux)

##### Adding Extensions

The following extensions are recommended for a good developer experience
with this codebase:

General Extensions:

1. [Auto Close Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-close-tag)
2. [Auto Rename Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag)
3. [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)

Extensions to help with Testing:

1. [EchoAPI for VSCode](https://marketplace.visualstudio.com/items?itemName=EchoAPI.echoapi-for-vscode)

Extensions to help with code formatting guidelines:

1. [EditorConfig for VSCode](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
2. [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
3. [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

Extensions to help with third-party servers:

1. [PostgreSQL](https://marketplace.visualstudio.com/items?itemName=ms-ossdata.vscode-pgsql)
2. [Redis for VSCode](https://marketplace.visualstudio.com/items?itemName=Redis.redis-for-vscode)
3. [MongoDB for VSCode](https://marketplace.visualstudio.com/items?itemName=mongodb.mongodb-vscode)

Extensions to help with Git:

1. [Git Graph](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph)
2. [Git History](https://marketplace.visualstudio.com/items?itemName=donjayamanne.githistory)
3. [GitLens - Git supercharged](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)

#### SETTING UP THE ENVIRONMENT

##### Generating the GPG Key

The [Entity Value Aggregate Server](https://github.com/twyr/entity-value-aggregate-server)
requires that every commit be signed before it is accepted for merging into
the main branch prior to release.

All contributors are expected to create a GPG Key and use it to sign all
their commits during the development process. At the very minimum, all _Pull
Requests_ are expected to be signed by the contributors' GPG Key prior to
being accepted.

Please follow the Github guide on [Managing commit signature verification](https://help.github.com/en/github/authenticating-to-github/managing-commit-signature-verification) for instructions on how to get the
key and integrate it into your development process.

##### Setting up Git Config Locally

```bash
git config commit.gpgsign true

git config trailer.sign.key "Signed-off-by: "
git config trailer.sign.ifmissing add
git config trailer.sign.ifexists doNothing
git config trailer.sign.command 'echo "$(git config user.name) <$(git config user.email)>"'

git config user.name "YOUR NAME"
git config user.email "your.name@auramwellness.com"
git config user.signingKey "GPG Key Id"
```

##### Setting up Git Split Diff

Strictly speaking, this is absolutely unnecessary. However, it makes git-diff-ing
on the command-line easier on the eye, so it is a suggestion that you may want to
explore.

In the root package.json, add `git-split-diffs` to the monorepo devDependencies.
Then, add the following to the git config:

```bash
git config core.pager "npx --no-install git-split-diffs --color | less -+LFX"
git config split-diffs.theme-name <<PREFERRED_THEME_NAME>>
git config split-diffs.syntax-highlighting-theme <<PREFERRED_THEME_NAME>>
```

The list of supported themes:

- [Split Diff Themes](https://github.com/banga/git-split-diffs#themes)
- [Syntax Highlighting Themes](https://github.com/banga/git-split-diffs#syntax-highlighting)

#### SETTING UP THIRD PARTY SERVERS

The framework requires that the code has runtime access to:

1. node.js
1. PostgreSQL Database Server
1. MongoDB NoSQL / Document Server
1. Redis Cache

##### Installing Node.js

Instructions for installing the latest version of Node.js on Debian / Ubuntu
based systems can be found here: [Installing Node.js on Debian / Ubuntu](https://github.com/nodesource/distributions/blob/master/README.md#debinstall)

For non Debian / Ubuntu systems, the official instructions can be accessed here:
[Installing Node.js on non Debian Systems](https://nodejs.org/en/download/package-manager/)

##### Installing MongoDB

Instructions for installing the latest version of MongoDB on Debian / Ubuntu
based systems can be found here: [Installing MongoDB on Debian / Ubuntu](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/)

For non Debian / Ubuntu systems, the official instructions can be accessed here:
[Installing MongoDB on non Debian Systems](https://www.mongodb.com/docs/manual/administration/install-community/)

##### Installing PostgreSQL

Instructions for installing the latest version of PostgreSQL on Debian / Ubuntu
based systems can be found here: [Installing PostgreSQL on Debian / Ubuntu](https://www.postgresql.org/download/linux/ubuntu/)

For non Debian / Ubuntu systems, the official instructions can be accessed here:
[Installing PostgreSQL on non Debian Systems](https://www.postgresql.org/download/)

After installing the PostgreSQL Server, install the additional packages with the
command:

```bash
sudo apt install postgresql-contrib libpq-dev
```

##### Installing Redis

Instructions for installing the latest version of Redis on Debian / Ubuntu
based systems can be found here: [Installing Redis on Debian / Ubuntu](https://redis.io/docs/getting-started/installation/install-redis-on-linux/)

For non Debian / Ubuntu systems, the official instructions can be accessed here:
[Installing Redis on non Debian Systems](https://redis.io/docs/getting-started/installation/)

#### CONFIGURING THIRD PARTY SERVERS

Once the third-party servers are setup and running, they need to be configured
before the [Entity Value Aggregate Server](https://github.com/troposphere-solns/osha-framework)
can run. Specifically:

1. Tweak PostgreSQL authentication mechanisms
1. Tweak memory setting for Redis

##### Configuring PostgreSQL

Setup a password for the postgres user:

```bash
$ sudo -u postgres psql

postgres=# \password

postgres=# \q
```

Modify the PostgreSQL configuration to allow logins for roles in the `Terminal`
by editing the `/etc/postgresql/[postgresql version]/main/pg_hba.conf` file:

Search for this line in the file:

```text
# "local" is for Unix domain socket connections only
local all  all  peer
```

Change this line, and the following ones to:

```text
# "local" is for Unix domain socket connections only
local   all             all                                     md5
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
```

Restart the PostgreSQL Server:

```bash
systemctl restart postgresql.service
```

Test if the changes are working:

```bash
$ psql -U postgres -W
Password:

psql (15.1)
Type "help" for help.

postgres=#
```

##### Configuring Redis

To ensure that Redis' background save tasks do not fail with a `fork()` error,
execute the following commands from the `Terminal`:

```bash
echo 'vm.overcommit_memory = 1' >> /etc/sysctl.conf
sysctl vm.overcommit_memory=1
```

Enable keyspace event notifications on Redis by editing the `/etc/redis/redis.conf`
file:

1. Search for `notify-keyspace-events`
1. Change its value to `KEA`

Restart the Redis Server:

```bash
systemctl restart redis.service
```

#### GETTING READY TO RUN

##### Installing required dependencies

Install all the required Node.js packages using the `Terminal`:

```bash
cd entity-value-aggregate-server
npm install --include=dev --workspaces --include-workspace-root
```

##### Setting up the database schema and seed data

Run the following commands from the `Terminal` to create the database:

```bash
psql -U postgres
password:

postgres=# CREATE ROLE twyr LOGIN PASSWORD 'twyr';
CREATE ROLE

postgres=# CREATE DATABASE twyr OWNER twyr ENCODING 'UTF8' LC_COLLATE='en_US.utf8' LC_CTYPE='en_US.utf8' TEMPLATE template0;
CREATE DATABASE

postgres=# ALTER ROLE twyr NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
ALTER ROLE

postgres=# ALTER ROLE twyr SET timezone TO 'Asia/Kolkata';
ALTER ROLE

postgres=# REVOKE ALL ON DATABASE twyr FROM PUBLIC;
REVOKE

postgres=# GRANT ALL ON DATABASE twyr TO twyr;
GRANT
```

Next, run the following commands from the `Terminal` to setup the database:

```bash
npm run db:migrate
npm run db:seed
```

#### Running the Server

If everything has gone according to plan:

1.Copy the environment file over:

```bash
cd entity-value-aggregate-server/servers/rest-api-server
cp .env.example .env.development
```

Adjust the configurations in the .env.development file to match your local settings.

2.Run the server from the `Terminal`:

```bash
cd entity-value-aggregate-server
npm start
```

If the server starts successfully, the `Terminal` should display:

```text
+----------+-----------+----------+---------------------------+------+
|  (index) | Interface | Protocol | Address                   | Port |
+----------+-----------+----------+---------------------------+------+
|     0    | lo        | IPv4     | 127.0.0.1                 | 9090 |
|     1    | lo        | IPv6     | ::1                       | 9090 |
|     2    | wlp1s0    | IPv4     | 192.179.4.130             | 9090 |
|     3    | wlp1s0    | IPv6     | fe80::5af4:ff3b:634d:4707 | 9090 |
+----------+-----------+----------+---------------------------+------+

info:
TICKING AWAY THE MOMENTS THAT MAKE UP A DULL DAY...
REST API Server started in: 11627.4438ms
```

Congratulations! You are now ready to start contributing to the source code!!
Welcome to the club :-)
