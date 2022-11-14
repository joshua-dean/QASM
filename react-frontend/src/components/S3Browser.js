import { Component } from 'react';
import S3Folder from "./S3Folder.js";
import S3File from "./S3File.js";
const { image_types, function_names } = require("../../public/electron_constants.js");
const { s3_browser_modes } = require("../QASM/constants.js");

class S3Browser extends Component {
    component_updater = 0;

    constructor(props) {
        super(props);
        
        this.QASM    = props.QASM
        this.mode    = window.S3_BROWSER_MODE // Set by window opener
        this.path    = window.START_FOLDER
        this.parents = props.parents || [] // Stack of parent folders
        
        if (this.path == null) {
            this.path = "" 
            this.folders = this.QASM.folders
            this.files   = this.QASM.files
        } else {
            this.setS3Path(this.path);
        }

        this.state = {
            path: this.path
        };

        // Bind functions
        this.selectFolder      = this.selectFolder.bind(this);
        this.changePath        = this.changePath.bind(this);
        this.goBack            = this.goBack.bind(this);
        this.selectFile        = this.selectFile.bind(this);
        this.createFile        = this.createFile.bind(this);
        this.getDisplayMode    = this.getDisplayMode.bind(this);
        this.updateDisplayMode = this.updateDisplayMode.bind(this);
        this.setS3Path         = this.setS3Path.bind(this);
        this.readS3Link        = this.readS3Link.bind(this);
    }


    /**
     * Change the current location to be 
     * at the given s3 path.
     * 
     * @param {string} path s3 path
     */
    setS3Path(path) {
        this.path = path;
        this.folders = []
        this.files = []
            
        // Populate parent stack
        this.parents = [""]
        let folders = path.split("/").slice(0, -2);
        for (let i=0; i < folders.length; i++) {
            this.parents.push(this.parents[i] + folders[i] + "/");
        }
        
        this.changePath(path).then(() => {
            this.parents.pop(); // Remove starting path from parent stack
        });
    }


    /**
     * Check that current folder has images,
     * then send folder path to the main window.
     */
    selectFolder() {
        let images_present = false;
        for (let file of this.files) {
            let ext = file.split('.').pop()
            if (ext in image_types) {
                images_present = true;
                break;
            }
        }
        
        if (images_present) {
            let data = {
                success: true,
                path: this.path,
            }
            // Send data back to parent window
            window.opener.postMessage(data, '*');
            window.close();
        } else {
            alert("No images found in folder " + this.path);
        }
    }
    

    /**
     * Check if selected file is of the correct type,
     * then send the filepath to the main window.
     * 
     * @param {string} file filename
     */
    selectFile(file, seek_confirmation = true) {
        // Exclude SELECT_DIRECTORY mode from selecting files
        if (this.mode !== s3_browser_modes.SELECT_DIRECTORY) {

            // Grab the file's extension
            let ext = file.split('.').pop()

            // Check the file extension to see if its valid in the current mode
            switch(this.mode) {
                case s3_browser_modes.SELECT_JSON:
                case s3_browser_modes.SAVE_JSON:
                    if (ext.toLowerCase() !== "json") {
                        alert("Selected file not of type json.");
                        return;
                    }
                    break;

                case s3_browser_modes.SELECT_IMAGE:
                case s3_browser_modes.SAVE_IMAGE:
                    // Alert user and return early if file extension isn't in image_types
                    if (!(ext in image_types)) {
                        alert("Selected file does not have supported image extension.");
                        return;
                    }
                    else {
                        console.log("Clicked on an image")
                    }
                    break;

                default:
                    alert("Unsupported mode: " + this.mode);
                    return;
            }

            // Ask for confirmation if confirmation is requested and in a saving mode
            if (seek_confirmation && (this.mode === s3_browser_modes.SAVE_IMAGE || this.mode === s3_browser_modes.SAVE_JSON)) {
                // If we don't recieve an affermative answer return early
                if (!window.confirm("Are you sure you want to overwrite " + file + "?")) {
                    return;
                }
            }

            console.log("final code being called")
            let data = {
                success: true,
                path: file,
            }
            // Send data back to parent window
            window.opener.postMessage(data, '*');
            window.close();
        }
    }


    /**
     * Scrape user filename from the input and
     * ask the user to confirm before saving.
     */
    createFile(current_mode) {
        // Get the extention type based on browser mode
        let extension;
        switch(current_mode) {
            case s3_browser_modes.SELECT_JSON:
            case s3_browser_modes.SAVE_JSON:
                extension = ".json";
                break;
            
            case s3_browser_modes.SELECT_IMAGE:
            case s3_browser_modes.SAVE_IMAGE:
                extension = ".png";
                break;

            default:
                throw new Error("Trying to create image with unknown file type.");
        }

        let new_filename = document.getElementById("new-filename").value;
        new_filename = new_filename.replace(" ", "_").split('.')[0]; // Space -> underscore, remove extension
        new_filename = new_filename + extension; // Save with proper extension
        new_filename = this.path + new_filename; // Add full path
        
        /* eslint-disable */
        // Prompt user to confirm, then save
        if (confirm("Save file as " + new_filename + "?")) {
            this.selectFile(new_filename, false);
        }
    }


    /**
     * Scrape s3 link from the input and
     * ask the user to confirm before navigating.
     */
     readS3Link() {
        let link = document.getElementById("s3-link").value;
        console.log(link);
        /* eslint-disable */
        // Prompt user to confirm, then save
        if (confirm("Go to path ' " + link + " ' ?")) {
            this.setS3Path(link);
        }
    }


    /**
     * Change the active path to a new folder
     * and populate its folders and files 
     * 
     * @param {string} folder folder name
     */
    async changePath(folder) {
        try {
            let response = await this.QASM.call_backend(window, function_names.OPEN_S3_FOLDER, folder);
            this.folders = response.folders;
            this.files = response.files;
            this.parents.push(this.path);
            this.path = folder;

            this.setState({
                path: this.path
            });
        } catch {
            console.log("Failed to load " + folder);
        }
    }


    /**
     * Go up one folder level and
     * populate the folders and files
     */
    async goBack() {
        let folder = this.parents.pop();
        if (this.parents.length > 0) {
            folder += folder.endsWith("/") ? "" : "/" // Add trailing slash if not present
        }
        try {
            let response = await this.QASM.call_backend(window, function_names.OPEN_S3_FOLDER, folder);
            this.folders = response.folders;
            this.files = response.files;
            this.path = folder;

            this.setState({
                path: this.path
            });
        } catch {
            console.log("Failed to go back to " + folder);
            this.parents.push(folder);
        }
    }


    /**
     * Checks which mode and size are currently selected. If the radio
     * buttons haven't loaded in yet, then the querySelector will be null
     * and we use the default of grid medium.
     * 
     * @returns {string} Display mode and size as string
     */
    getDisplayMode() {
        let style, size;

        if (document.querySelector("input[name='display']:checked") === null) {
            style = "grid";  // Default
        }
        else {
            // Currently checked display style radio button
            style = document.querySelector("input[name='display']:checked").value;
        }

        if (document.querySelector("input[name='display-size']:checked") === null) {
            size = "medium"; // Default
        }
        else {
            // Currently checked size radio button
            size = document.querySelector("input[name='display-size']:checked").value;
        }

        return style + " " + size;
    }


    /**
     * Updates the class on the div that holds all of the s3 stuff.
     */
    updateDisplayMode() {
        document.getElementById("s3-folder-holder").className = this.getDisplayMode();
    }


    render() {
        return (
            <div className="S3Folder">
                <h2>S3 Browser: {this.QASM.s3_bucket}</h2>
                <div className="fieldset-container">
                    <fieldset className="directory-display-mode" onChange={this.updateDisplayMode}>
                        <legend>Display Mode</legend>
                        <div>
                            <input type="radio" id="grid-display" name="display" value="grid" defaultChecked />
                            <label htmlFor="grid-display">Grid</label>
                        </div>
                        <div>
                            <input type="radio" id="list-display" name="display" value="list" />
                            <label htmlFor="list-display">List</label>
                        </div>
                    </fieldset>
                    <fieldset className="directory-display-size" onChange={this.updateDisplayMode}>
                        <legend>Size</legend>
                        <div>
                            <input type="radio" id="display-small" name="display-size" value="small" />
                            <label htmlFor="display-small">Small</label>
                        </div>
                        <div>
                            <input type="radio" id="display-medium" name="display-size" value="medium" defaultChecked />
                            <label htmlFor="display-medium">Medium</label>
                        </div>
                        <div>
                            <input type="radio" id="display-large" name="display-size" value="large" />
                            <label htmlFor="display-large">Large</label>
                        </div>
                    </fieldset>
                    {this.mode === s3_browser_modes.SELECT_DIRECTORY &&
                        <button 
                            onClick={this.selectFolder}
                            className="button">
                            Select Directory: {this.path}
                        </button>
                    }
                </div>
                <div className="s3-path-container">
                    <button
                        onClick={this.readS3Link}
                        className="button">
                        Go to S3 Path:
                    </button>
                    <input
                        id="s3-link"
                        type="text"
                    />
                </div>
                {(this.mode === s3_browser_modes.SAVE_JSON || this.mode === s3_browser_modes.SAVE_IMAGE) &&
                    <div className="fieldset-container">
                        <button 
                            onClick={() => this.createFile(this.mode)}
                            className="button">
                            Save Here to New File:
                        </button>
                        <input
                            id="new-filename"
                            type="text"
                        />
                    </div>
                }
                <br/>
                {this.parents.length !== 0 &&
                    <button 
                        onClick={this.goBack}
                        className="back-button button">
                        Back
                    </button>
                }
                <div className={this.getDisplayMode()} id="s3-folder-holder">
                    {this.folders.map(folder_name => (
                        <div onClick={e => this.changePath(folder_name)} key={folder_name} className="clickable">
                            <S3Folder
                                path={folder_name}/>  
                        </div>
                    ))}
                    {this.files.map(file_name => (
                        <div onClick={e => this.selectFile(file_name)} key={file_name} className="clickable">
                            <S3File
                                key={file_name}
                                path={file_name}/> 
                        </div> 
                    ))}
                </div>
            </div>
        )
    }
}

export default S3Browser;