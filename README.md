Angular Localization Manager Command Line Tool
============================================================

This tool aims to simply the angular localization management.

# Quickstart

```sh
$ npm install -g angular-localization-manager-cli
$ alm version
$ alm config
```

# How to Use

This tool aids in managing the localization files.

```sh
Usage: alm <command> [options]

Commands:
  config   Generate the config file
  version  Show the CLI version
```

## Command: config

Generates a config file compatible with the angular localization UI.

### --path or -p

Local directory used to generate the config. Defaults to current working directory.

### --basePath or -b

Defines the folder where the locale bundles are stored. Defaults to `languages`.

### --ext or -e

The bundle file extension. Defaults to `.lang.json`.

### --file or -f

Save config to a file. No default value.
