<h1 align="center">
    Entity Value Aggregate Server
</h1>
<div align="center">
    <a href="https://spdx.org/licenses/MITNFA.html"><img src="https://img.shields.io/badge/License-MIT%20%2Bno--false--attribs-blue" /></a>
    <a href="https://github.com/twyr/entity-value-aggregate-server/src/main/CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg" /></a>
</div>
<div align="center">
    Entity Value Aggregate Server written in node.js for the Twyr Platform
</div>
<hr />

| Category       | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conventions    | [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-brightgreen.svg)](https://conventionalcommits.org) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/twyr/entity-value-aggregate-server) [![All Contributors](https://img.shields.io/github/all-contributors/twyr/entity-value-aggregate-server?color=ee8449&style=flat-square)](#contributors) |
| Code Stats     | ![GitHub repo size](https://img.shields.io/github/repo-size/twyr/entity-value-aggregate-server) [![Coverage Status](https://coveralls.io/repos/github/twyr/entity-value-aggregate-server/badge.svg?branch=main)](https://coveralls.io/github/twyr/entity-value-aggregate-server?branch=main)                                                                                                                                                                                                                                                                                                 |
| Security       | [![Known Vulnerabilities](https://snyk.io/test/github/twyr/entity-value-aggregate-server/badge.svg?targetFile=package.json)](https://snyk.io/test/github/twyr/entity-value-aggregate-server?targetFile=package.json)                                                                                                                                                                                                                                                                                                                                                                         |
| <br />         |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Development    | ![GitHub commit activity](https://img.shields.io/github/commit-activity/m/twyr/entity-value-aggregate-server) ![GitHub last commit](https://img.shields.io/github/last-commit/twyr/entity-value-aggregate-server)                                                                                                                                                                                                                                                                                                                                                                            |
| Issues         | ![GitHub open issues](https://img.shields.io/github/issues-raw/twyr/entity-value-aggregate-server) ![GitHub closed issues](https://img.shields.io/github/issues-closed-raw/twyr/entity-value-aggregate-server)                                                                                                                                                                                                                                                                                                                                                                               |
| Pull Requests  | ![GitHub open prs](https://img.shields.io/github/issues-pr-raw/twyr/entity-value-aggregate-server) ![GitHub closed prs](https://img.shields.io/github/issues-pr-closed-raw/twyr/entity-value-aggregate-server)                                                                                                                                                                                                                                                                                                                                                                               |
| <br />         |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Release Status | ![GitHub package.json version](https://img.shields.io/github/package-json/v/twyr/entity-value-aggregate-server/main) ![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/twyr/entity-value-aggregate-server?sort=semver) ![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/twyr/entity-value-aggregate-server?sort=semver)                                                                                                                                                                                                                             |

#### TABLE OF CONTENTS

- [TABLE OF CONTENTS](#table-of-contents)
- [CODE ORGANIZATION](#code-organization)
- [ARCHITECTURE AND DESIGN](#architecture-and-design)
    - [REST API Server](#rest-api-server-design)
- [CONTRIBUTING](#contributing)
    - [Code of Conduct](#code-of-conduct)
    - [Developing](#developing)
    - [Contributors](#contributors)
- [LICENSE](#license)

#### CODE ORGANIZATION

The Entity Value Aggregate Server codebase is organized as a monorepo with
[npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces)

- The npm packages can be found in the _packages_ folder of the monorepo.
- The servers can be found in the _servers_ folder of the monorepo.
- The root of the workspace contains npm scripts in the root _package.json_
  to let developers build the entire monorepo with a single command.

#### ARCHITECTURE AND DESIGN

The Entity Value Aggregate Server codebase is designed and architected according to the
principles of [Domain Driven Design](https://en.wikipedia.org/wiki/Domain-driven_design)
and [Modular Monolith](http://www.kamilgrzybek.com/design/modular-monolith-primer/)

See [Modular Monolith with DDD](https://github.com/kgrzybek/modular-monolith-with-ddd)
for an equivalent implementation in C# / .NET, and for an explanation of
Modular Monoliths, DDD, CQRS, the C4 Model, et al.

##### REST API Server Design

The documentation on how this server is designed and architected can be
found at [REST API Server Design](docs/arch/REST-API-SERVER-DESIGN.md)

#### CONTRIBUTING

##### Code of Conduct

All contributors to this project are expected to adhere to the
[Code of Conduct](CODE_OF_CONDUCT.md) specified.

##### Developing

Details on getting the code, setting up the development environment, and
instructions on how to extend/build/test the code are detailed in the
[Contribution Guide](CONTRIBUTING.md)

##### Contributors

This project follows the [all-contributors](https://allcontributors.org)
specification. Contributions of any kind, from all Twyr Team Members,
are welcome!

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

#### LICENSE

This project is licensed under the [MIT +no-false-attribs](https://spdx.org/licenses/MITNFA.html)
license. You may get a copy of the license by following the link, or at
[LICENSE.md](LICENSE.md)
