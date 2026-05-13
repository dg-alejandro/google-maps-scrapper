/**
 *responsibility: read the file .env and load  variables in process.env 
 *no external dependencies, using only native Node.js modules(fs,path) 
 */

const fs   = require('fs'); //fs allow us to work with the file system
const path = require('path'); //facilitate the work with files paths

/**
 *it reads the file .env and load every variable in process.env
 *if the file doesn't exists, the file indicates it and continues(the variables can come from the system)
 */

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');//process.cwd() returns the current working directory where Node.js is executed
                                                       //path.resolve creates an absolute path by combining the current working directory with '.env'
  if (!fs.existsSync(envPath)) {
    console.warn('Warning: .env file not found. Using system environment variables.');//check if the file exists, ensuring the program doesn't crash if .env is missing
    return;
  }

  const content = fs.readFileSync(envPath, 'utf-8');//we read the file as plain text

  for (const line of content.split('\n')) {//we split the content into lines
    //ignore empty lines and comments
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('#')) continue;

    //split into key=value (only on the first "=" to allow "=" in the value)
    const equalsIndex = cleanLine.indexOf('=');//find position of "=" in the actual line
    if (equalsIndex === -1) continue;//if there is no '=' in the line

    const key = cleanLine.slice(0, equalsIndex).trim();//take all from the begining until just after the "=", then we have the variable name
    const value = cleanLine.slice(equalsIndex + 1).trim();//the variable value

    
    //only assign the value from .env if it doesn't already exist, prioritizing system environment variables.
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

module.exports = { loadEnv };
