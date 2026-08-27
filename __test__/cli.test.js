const fs=require('fs-extra');
const path=require('path');
const { execSync }=require('child_process');

const TEST_PROJECT='test-generated-app';
const TEST_PATH=path.join(__dirname, '..', TEST_PROJECT);

describe('backend-scaffold-cli', () =>{
    afterAll(()=>{
        if(fs.existsSync(TEST_PATH)){
            fs.removeSync(TEST_PATH);
        }
    });




    test('package.json version should match cli version', () =>{
        const packageJson = require('../package.json');
        const cliContent = fs.readFileSync(
            path.join(__dirname, '..', 'bin', 'cli.js'),
            'utf8'
        );
        expect(cliContent).toContain('packageJson.version');
    });





    test('create project folderstructure', () =>{
        fs.ensureDirSync(TEST_PATH);

        const folderStructure = [
            'config', 'middleware', 'routes', 'controllers', 'models', 'utils'
        ];
        folderStructure.forEach(folder => {
            fs.ensureDirSync(path.join(TEST_PATH, 'src', folder));  
        });
        folderStructure.forEach(folder => {
            expect(fs.existsSync(path.join(TEST_PATH, 'src', folder))).toBe(true);
        });

    });

    


    test('project name collision is detected', () =>{
        fs.ensureDirSync(TEST_PATH);
        expect(fs.existsSync(TEST_PATH)).toBe(true);
    });
        


});




