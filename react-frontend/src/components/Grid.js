import { Component } from 'react';
import Image from "./Image.js";
// const webpack = require("webpack");

class Grid extends Component {
    images = {};
    image_names = [];
    GRID_WIDTH = 2;
    grid_image_names = [];
    image_src = "";
    classes = [];

    

    constructor(props) {
        super(props);
        
        // Initialize props
        this.GRID_WIDTH = props.grid_width || 2;
        this.image_src  = props.src        || "../data/images"; 
        this.classes    = props.classes    || ["plant", "rogue"];

        // new webpack.DefinePlugin({ IMAGE_SRC: JSON.stringify(this.image_src) });

        // Organize images
        // console.log(IMAGE_SRC);
        this.importAll(require.context("../data/images", false, /\.JPG$/)); // TODO: generalize image types
        this.image_names = Object.keys(this.images);
        this.gridSetup();
    }

    
    importAll(r) {
        // Get all images in a folder
        r.keys().forEach((key) => (this.images[key.slice(2)] = r(key)));
    }

    gridSetup() {
        // Divide grid based on the grid width prop
        let cur_im;
        let grid_counter = 0;
        let row_imgs = [];
        for (let i = 0; i < this.image_names.length; i++) {
            cur_im = this.image_names[i];

            // Add to grid
            if (grid_counter >= this.GRID_WIDTH) {
                this.grid_image_names.push(row_imgs);
                grid_counter = 0;
                row_imgs = [];
            }
            grid_counter++;
            row_imgs.push(cur_im);
        }
        this.grid_image_names.push(row_imgs);
    }

    render() {
        return (
            <div className="Grid">
                <table id="Grid-table">
                    <tbody>
                        {this.grid_image_names.map(row_image_names => (
                            <tr key={this.grid_image_names.indexOf(row_image_names)}>
                                {row_image_names.map(image_name => (
                                    <td key={image_name}>
                                        <Image 
                                            image={this.images[image_name]} 
                                            image_name={image_name} 
                                            classes={this.classes}
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
}

export default Grid;