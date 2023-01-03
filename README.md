# autoequil
Automated tool to run Equil software

## What is it
Antique tool written on chemical metrology department of Karazin unversity.
It calculates equilibria concentrations of components based on their total concentrations
and stoichiometric matrix.

Original tool runs on DOS environment. Autoequil aims to some automation of it
and deploys tool as simple web application and as library for further integration.

## Installation
```bash
npm install
npm build
npm serve
```

It installs all dependencies locally, builds jsdos bundle and start serving at http://127.0.0.1:8080 