# Issue Status Helper

[![Atlassian license](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

Issue Status Helper is a [Forge](https://developer.atlassian.com/platform/forge/) application that helps teams using Jira (especially those using the additional issue hierarchy levels provided by Advanced Roadmaps). It monitors updates to issues and can update the status of its ancestors (i.e. the issues above it within its hierarchy) to reflect their status relative to their children. For example, it ensures that when all stories in an epic have been completed that the epic is also completed.

It can also be configured to set start and end dates of issues based on their state transition (i.e. setting a start date when an issue is moved to "In Progress") or by the dates of the sprint that the issue is assigned to.

Automatically setting this data set ensures that higher-level issues can be trusted to reflect the state and estimated completion date of the work.

This application has been open-sourced to provide a "real-world" example of how to use Forge to enhance Atlassian products to meet your team needs!

## Usage

After installation, navigate to the "Apps" > "Manage your apps" page in Jira (this requires admin access) and enable the Issue Status Helper for the projects you want to monitor. For each project you can configure whether to add a comment when a change is made, whether to set dates from sprints and the issue status to use for each issue status category for every issue type used by the project.

It is possible to set default issue statuses for each status category and configure whether to update date fields (and which fields to use) from the "Global Settings" tab.

## Installation

You can install the latest release from the [Atlassian Marketplace](https://marketplace.atlassian.com/apps/1231916/issue-status-helper?tab=overview&hosting=cloud)

To build and test the application you will need to:

1. Follow the [Forge Getting Started Guide](https://developer.atlassian.com/platform/forge/getting-started/) to get yourself setup for Forge application development
2. Clone this repository
3. Use the CLI to [re-register](https://developer.atlassian.com/platform/forge/cli-reference/register/) the application
4. Use the CLI to [deploy](https://developer.atlassian.com/platform/forge/cli-reference/deploy/) and [install](https://developer.atlassian.com/platform/forge/cli-reference/install/) the application to your own instance

*Please Note: If you make a pull request you should not include the updated app id in the manifest.yml file!*

## Documentation

Coming soon!

## Tests

Automated tests soon!

## Contributions

Contributions to Issue Status Helper are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

Copyright (c) 2023 Atlassian US., Inc.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.

<br/>

[![With â¤ï¸ from Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers.png)](https://www.atlassian.com)
