// Grid labeler that supports multiple classes via checkboxes
import { Component } from 'react';
import MultiClassGridImage from "./MultiClassGridImage.js";
import $ from "jquery";
import "../css/Grid.css";
const { update_all_overlays } = require("../QASM/utils.js");
const { function_names } = require("../../public/electron_constants.js");

// TODO: Combine this with Grid, and/or add to app as a seperate component. 
// TODO: Move functions common w/Grid to a utils file

class MultiClassGrid extends Component {
    images = {};
    image_names = [];
    grid_width = 1;
    grid_image_names = [];
    src = "";
    classes = {};
    component_updater = 0;
    image_stack = [];
    hover_image_id = null;
    hover_row_id = null;
    images_shown = false;
    update_success = false;
    allow_next_scroll = false;

    constructor(props) {
        super(props);

        // Initialize props
        this.QASM = props.QASM
        this.grid_width = props.grid_width || 1;
        this.classes = props.classes
        this.src = props.src

        this.labels = this.initLabels();
        this.state = {
            labels: this.labels,
            src: this.src,
        };


        // Attach event listeners
        this.initEventListeners();

        // Bind functions
        this.loadImages = this.loadImages.bind(this);
        this.initLabels = this.initLabels.bind(this);
        this.saveLabels = this.saveLabels.bind(this);
        this.loadLabels = this.loadLabels.bind(this);
        this.clearAll = this.clearAll.bind(this);
        this.selectImageDir = this.selectImageDir.bind(this);
        this.changeGridWidth = this.changeGridWidth.bind(this);
        this.updateState = this.updateState.bind(this);
        this.updateLocalLabels = this.updateLocalLabels.bind(this);
        this.addImageLayer = this.addImageLayer.bind(this);
        this.getImageStackByName = this.getImageStackByName.bind(this);
        this.changeImage = this.changeImage.bind(this);
        this.autoScroll = this.autoScroll.bind(this);
        this.initEventListeners = this.initEventListeners.bind(this);
    }


    /**
     * Attach event listeners to the page.
     */
    initEventListeners() {
        // Update the overlays whenever the page size is changed
        window.addEventListener("resize", update_all_overlays);

        // Update which image is currently being hovered
        document.addEventListener("mousemove", (e) => {
            if (e.target.className.includes("hover-target")) {
                // Every single hover-target will be inside of a div that's 
                // inside of a div, that has the id that we're trying to select.
                this.hover_image_id = e.target.parentNode.parentNode.id;
                this.hover_row_id = e.target.parentNode.parentNode.parentNode.parentNode.id;
            }
            else {
                this.hover_image_id = null;
                this.hover_row_id = null;
            }
        });

        // Prevent weird behavior when scrolling
        window.addEventListener("scroll", () => {
            if (this.allow_next_scroll) {
                this.allow_next_scroll = false;
            } else {
                this.hover_image_id = null;
            }
        });

        // Keybinds
        window.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                this.saveLabels();
            }

            if (this.hover_image_id !== null && e.key === "b") {
                this.changeImage(this.hover_image_id);
            }

            if (this.hover_row_id !== null && e.key === "n") {
                this.autoScroll(this.hover_row_id);
            }
        });
    }




    /**
     * Update the state variables and force
     * the page to update.
     */
    updateState() {
        this.setState({
            labels: this.labels,
            src: this.src,
        });
        this.component_updater++;
    }


    /**
     * Load images from the current source directory
     */
    async loadImages() {
        console.log("Src: " + this.src);
        this.images = await this.QASM.call_backend(window, function_names.LOAD_IMAGES, this.src);
        this.image_names = Object.keys(this.images).sort();
        console.log(this.images);
        this.gridSetup();
        this.clearAll();
    }


    /**
     * Organize the images into rows
     */
    gridSetup() {
        // Divide grid based on the grid width prop
        let cur_im;
        let grid_counter = 0;
        let row_imgs = [];
        this.grid_image_names = [];
        for (let i = 0; i < this.image_names.length; i++) {
            cur_im = this.image_names[i];

            // Add to grid
            if (grid_counter >= this.grid_width) {
                this.grid_image_names.push(row_imgs);
                grid_counter = 0;
                row_imgs = [];
            }
            grid_counter++;
            row_imgs.push(cur_im);
        }
        this.grid_image_names.push(row_imgs);
    }


    /**
     * Scrape the page for all the current labels
     */
    updateLocalLabels() {
        // Get state of each GridImage
        this.labels = this.initLabels(); // Gen new object w/datetime
        for (let i = 0; i < this.image_names.length; i++) {
            let image_name = this.image_names[i];
            if (this.labels[image_name] === undefined) { this.labels[image_name] = {}; }
            Object.keys(this.classes).map(class_type => (
                this.classes[class_type].class_values.map(class_val => {
                    if (document.getElementById(image_name + "_" + class_val).checked) {

                        this.labels[image_name][class_type] = class_val;
                    }
                    else if (this.labels[image_name] === class_val) {
                        delete this.labels[image_name][class_type];
                    }
                    return null;
                }
                )
            ))

        }
    }

    
    /**
     * Create a new labels object with current metadata
     * (datetime, app name, app version), or add these 
     * fields to an existing labels object if they don't exist 
     * already.
     * 
     * @param {Object} labels existing labels object
     * @returns {Object} labels
     */
     initLabels(labels = null) {
        if (labels === null) {
            // Create new labels
            labels = {}
        }
        
        if (!("name" in labels)) {
            labels["name"] = this.QASM.config["name"];
        }

        if (!("version" in labels)) {
            labels["version"] = this.QASM.config["version"];
        }

        if (!("datetime" in labels)) {
            labels["datetime"] = new Date().toLocaleString();
        }

        return labels;
    }


    /**
     * Scrape the page for the current labels
     * and prompt the user to specify where to save them.
     */
    async saveLabels() {
        this.updateLocalLabels();

        let params = {
            labels: this.labels,
            path: this.src,
        }

        await this.QASM.call_backend(window, function_names.SAVE_JSON_FILE, params);
    }


    /**
     * Prompt user to select a file with labels
     * and load them in.
     */
    async loadLabels() {
        // Load in previous labels
        let labels = await this.QASM.call_backend(window, function_names.LOAD_LABELS, this.src);
        this.labels = this.initLabels(labels);
        console.log(this.labels);

        if (Object.keys(this.labels).length > 0) {
            this.updateState(); // Update state to rerender page
        } else {
            console.log("Prevented loading empty labels.");
        }
    }


    /**
     * Clear all the current labels
     */
    clearAll() {
        // Set all classes to the default
        this.labels = this.initLabels();
        this.updateState();
    }


    /**
     * Open a directory selection dialog and 
     * load in all the images.
     */
    async selectImageDir() {
        let dir_path = await this.QASM.call_backend(window, function_names.OPEN_DIR);
        if (dir_path !== undefined) {
            if (this.src !== dir_path) {
                this.image_stack = []; // Clear image stack on new directory load
            }
            this.src = dir_path;
            await this.loadImages();

            // Set the images shown to true now that the images are shown
            this.images_shown = true;
            this.updateState();
        } else {
            console.log("Prevented loading invalid directory.");
        }
    }


    /**
     * Prompt user to select a directory
     * and push all the images onto the image stack
     */
    async addImageLayer() {
        // Prompt user to select directory
        let dir_path = await this.QASM.call_backend(window, function_names.OPEN_DIR, this.src);
        console.log(dir_path);

        // Load images and add them to the image stack
        let image_layer = await this.QASM.call_backend(window, function_names.LOAD_IMAGES, dir_path);
        if (Object.keys(image_layer).length === 0) {
            console.log("Prevent adding empty layer.");
        } else {
            this.image_stack.push(image_layer);
        }
        console.log(this.image_stack);
        this.updateState();
    }


    /**
     * Change the grid width
     * 
     * @param {*} e event 
     */
    changeGridWidth(e) {
        this.grid_width = e.target.value; // Get current grid width
        this.updateLocalLabels(); // Store current labels
        this.gridSetup(); // Reformat grid
        this.updateState(); // Update page
    }


    /**
     * Get an array of image layers for an image
     * 
     * @param {string} image_name image name
     * @returns {Array} image stack; array of images
     */
    getImageStackByName(image_name) {
        let image_stack = [];
        for (let image_layer of this.image_stack) {
            if (image_name in image_layer) {
                image_stack.push(image_layer[image_name]);
            }
        }
        return (image_stack);
    }


    /**
     * Cycle through the image layers for an image
     * 
     * @param {string} hover_image_id id of the current image
     */
    changeImage(hover_image_id) {
        // firstChild = image holder div
        // childNodes of image holder div = image layers

        let layers = document.getElementById(hover_image_id).firstChild.childNodes;
        for (let idx = 0; idx < layers.length; idx++) {
            let layer = layers[idx];
            // Skip overlays and hidden images
            if (layer.id.includes("overlay") || layer.classList.contains("hidden")) {
                continue;
            }

            // Change currently shown image to hidden
            layer.classList.add("hidden");

            // Change next hidden image to shown
            if (idx + 1 === layers.length) {
                // If we're at the last layer, turn on the og image
                layers[1].classList.remove("hidden");
            } else {
                // Un-hide next image
                layers[idx + 1].classList.remove("hidden");
            }
            // Done
            break;
        }
    }


    /**
     * Scroll page to the next row 
     * 
     * @param {string} hover_row_id id of the current row
     */
    autoScroll(hover_row_id) {
        // Scroll to next row
        $(document).scrollTop($("#" + hover_row_id).next().offset().top);
        // Set next row as hovered for consecutive navigation
        this.hover_row_id = $("#" + hover_row_id).next()[0].id;

        // Set next image as hovered
        if (this.hover_image_id != null) {
            let row = parseInt(hover_row_id.slice(4)); // Row index
            let col = this.grid_image_names[row].indexOf(this.hover_image_id) // Col
            row = parseInt(this.hover_row_id.slice(4)); // New row index
            this.hover_image_id = this.grid_image_names[row][col]; // Set new image as hovered
            this.allow_next_scroll = true; // Override scroll protection
        }
    }


    render() {
        return (
            <div className="Grid" key={this.component_updater}>
                <div className="header-container">
                    {/* <Legend
                        classes={this.classes}
                    /> */}
                    <div className={this.images_shown ? "hidden" : "controls-container"}>
                        <button
                            onClick={this.selectImageDir}
                            className="button">
                            Select Directory
                        </button>
                        <div className="change-grid-width-container">
                            <label htmlFor="change-grid-width-og">
                                Grid Width:
                            </label>
                            <input
                                id="change-grid-width-og"
                                type="number"
                                value={this.grid_width}
                                size={2} // Number of visible digits
                                step={1}
                                min={1}
                                max={99}
                                onChange={this.changeGridWidth}>
                            </input>
                        </div>
                    </div>
                    <div className={this.images_shown ? "controls-container" : "hidden"}>
                        <button
                            onClick={this.selectImageDir}
                            className="button">
                            Select Directory
                        </button>
                        <button
                            onClick={this.addImageLayer}
                            className="button">
                            Add Image Layer
                        </button>
                        <div className="change-grid-width-container">
                            <label htmlFor="change-grid-width-new">
                                Grid Width:
                            </label>
                            <input
                                id="change-grid-width-new"
                                type="number"
                                value={this.grid_width}
                                size={2} // Number of visible digits
                                step={1}
                                min={1}
                                max={99}
                                onChange={this.changeGridWidth}>
                            </input>
                        </div>
                        <button
                            onClick={this.loadLabels}
                            className="button">
                            Load Labels
                        </button>
                        <button
                            onClick={this.saveLabels}
                            className="button">
                            Save Labels
                        </button>
                        <button
                            onClick={this.clearAll}
                            className="button">
                            Clear All Labels
                        </button>
                    </div>
                </div>
                <table id="Grid-table">
                    <tbody>
                        {this.grid_image_names.map(row_image_names => (
                            <tr
                                key={"row_" + this.grid_image_names.indexOf(row_image_names)}
                                id={"row_" + this.grid_image_names.indexOf(row_image_names)}
                            >
                                {row_image_names.map(image_name => (
                                    <td key={image_name}>
                                        <MultiClassGridImage
                                            image={this.images[image_name]}
                                            image_name={image_name}
                                            classes={this.classes}
                                            image_stack={
                                                this.getImageStackByName(image_name)
                                            }
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    componentDidMount() {
        // Ensure update runs once the page is fully loaded
        setInterval(() => {
            if (!this.update_success) {
                this.update_success = update_all_overlays();
            }
        }, 1000)
    }

    componentDidUpdate() {
        // Update overlays
        this.update_success = update_all_overlays();
    }
}

export default MultiClassGrid;