### About

This project provides a template you can use to analyze, with [Sokrates](https://sokrates.dev), all source code of all repositories in any GitHub organization.

### The Concept

The project analyzes all repositories in given GitHub organizations. For each repository, it creates a detailed project report. It puts all reports in a folder, where you can run `sokrates updateLandscape` command to create a landscape overview of the whole organization (volume, project trends, team topologies...).

### Pre-requirements

- Latest version of [Sokrates](https://sokrates.dev) CLI<pre>curl https://d2bb1mtyn3kglb.cloudfront.net/builds/sokrates-LATEST.jar --output sokrates-LATEST.jar</pre>
- Java 11 to run [Sokrates](https://sokrates.dev) CLI, e.g.:
- unzip
- [Graphviz](https://graphviz.org/) (optional, but highly recommended as it significantly improves the performance of Sokrates graph rendering)
- Recent version of Node.js to run GitHub API and code generation scripts
- An environment (e.g., Linux, MacOS...) that can run BASH (.sh) scripts
- Enough space on disk to store zipped version of all repos and generated Sokrates reports (several GBs at least)

### Install & Run

- Clone this repo, and go to the cloned folder
  <pre>git clone https://github.com/zeljkoobrenovic/sokrates-oss-landscape-analysis.git
  cd sokrates-oss-landscape-analysis</pre>

- Open and edit the **analysis-scripts/config.json** file: 
  - add you **GitHub access token**
  - add the full **path to the downloaded Sokrates CLI JAR file**
  - add the **list of GitHub organizations** you want to analyze (you can analyze multiple organizations)
  - eventually change GitHub instance and API URLs (by default, configuration points to github.com, but you can use this project with your organizational GitHub instances as well).
- From the root of this cloned repository, run: <pre>bash run.sh</pre>
- Depending on the size of the organization, the analysis may take minutes or several hours
- The analysis will create the **analysis-artifacts** folder with the following sub-folders:
  - **archived-repos**, where zipped sources code used as an input for analyses is stored
  - **reports**, with sub-folders per organization
  - **pull-requests**, with data and static HTML reports files for each organization
- Generated reports and downloaded repos are **timestamped** (folders of reports and archived repos contain the timestamps subfolder). If you **re-run the analysis**, then only **repositories that have changed** (based on the timestamp file) are cloned and analyzed. If you want to re-run the analysis for all repositories, just delete the **analysis-artifacts** folder.  

### How the Analysis Works?

The analysis works in several steps:

- ***Step 1: discovering active GitHub repositories***
  - the Node.js script **analysis-scripts/github-repos-finder/get-repos.js** connects to the GitHub API and gets the list of all repositories. The script filters the list of repositories by the last push date, ignoring the repositories that have not been updated recently (you can configure the threshold date in **analysis-scripts/config.json**). The script also ignores archived repositories.
  - The script stores filtered lists of repositores as JSON files in **analysis-scripts/generated/data**, to be used by the next step.
- ***Step 2: generating clone, analysis and pull request download Bash scripts***
  - the Node.js script **analysis-scripts/github-repos-finder/generate-sh-scripts.js** takes the lists of repositores from the **analysis-scripts/generated/data** folder and generate three types of scripts in the following folders:
    - **analysis-scripts/generated/clone-scripts**/
      - Bash scripts for cloning and zipping the source code repositories for later analyses.
    - **analysis-scripts/generated/analysis-scripts**/
      - Bash scripts for analyses of stored repositores. 
    - **analysis-scripts/generated/pull-requests-scripts**/
      - Bash scripts for downloading GitHub pull request data, and creating static HTML reports.
- ***Step 3: running the clone scripts***
  - Running the **analysis-scripts/generated/clone-scripts**/ bash scripts that:
    - **clone** repositores
    - **clean** them (e.g., removing typical binaries) 
    - **extract Git history** needed to Sokrates analyses 
    - **delete the .git folder** to save space, 
    - **zips** the cleaned folder
    - **stores the zipped file** in the **analysis-artifacts/archived-repos/** folders
- ***Step 4: running the analysis scripts***
    - Running the **analysis-scripts/generated/analysis-scripts**/ bash scripts that:
    - **take zipped repos** from **analysis-artifacts/archived-repos/** unzip them in a temporary folder 
    - **run sokrates analysis** (**sokrates init** and **sokrates generateReports** commands) 
    - **copies the analysis results** in the **analysis-artifacts/reports/** folders
    - remove the temporary folders
- ***Step 5: Running the pull-requests download scripts***
    - Running the **analysis-scripts/generated/pull-requests-scripts**/ bash scripts that:
      - downloads and stores in JSON files the pull request metadata for all repositories
      - generates static HTML pull request reports for each organization

