import { Component } from 'react';
import './css/App.css';

import Grid from "./components/Grid.js";
import Home from "./components/Home.js";
import BinaryEditors from "./components/BinaryEditors.js";
import S3Browser from "./components/S3Browser.js";
import ImageLabeler from './components/ImageLabeler';

import icon from "../public/icon.png";
import {HashRouter, Link, Route, Routes} from "react-router-dom";

// Link keys to components
const COMPONENT_KEYS = {
  "grid":          (props) => {return <Grid {...props}/>},
  "home":          (props) => {return <Home {...props}/>},
  "binaryeditor":  (props) => {return <BinaryEditors {...props}/>},
  "S3Browser":     (props) => {return <S3Browser {...props}/>},
  "imagelabeler":  (props) => {return <ImageLabeler {...props}/>},
}

class App extends Component {
  src = "";
  componentList = [];

  constructor(props) {
    super(props);

    
    // Initialize props
    this.QASM           = props.QASM; // QASM object
    this.config         = props.config;
    this.components     = this.config.components;
    this.component_keys = Object.keys(this.components);
    this.location       = window.location.href.split("/").slice(-1)[0] // Just page name
    
    for (let component_key in this.components) {
      // Add QASM object to all component props
      let props = this.components[component_key]
      props.QASM = this.QASM;

      // Build component list
      this.componentList.push(
        COMPONENT_KEYS[component_key](props)
      )
    }

    // Setup S3 browser
    this.s3props = {
      "QASM": this.QASM,
    }
  }
  
  render() {
    return (
      <HashRouter>
      <div className="App">
        { this.location !== "s3Browser" &&
          // Disable navbar when in the s3Browser
          <div className="menu">
            <a href='/' id="menu-logo">
              <img src={icon} alt="Logo" />
            </a>
            {this.component_keys.map(component_key => (
              <Link 
                className="Link"
                to={component_key === "home" ? "/" : component_key}
                key={component_key}>
                <h2>
                  {this.components[component_key].display_name === undefined 
                  ? component_key 
                  : this.components[component_key].display_name}
                </h2>
              </Link>
            ))}
          </div>
        }
        <Routes>
          {this.componentList.map((component, idx) => (
            <Route 
              path={this.component_keys[idx] === "home" ? "/" : this.component_keys[idx]} 
              element={component}
              key={idx}/>
          ))}
          <Route 
            path="S3Browser" 
            element={COMPONENT_KEYS["S3Browser"](this.s3props)}
            key="S3Browser"/>
        </Routes>
      </div>
      </HashRouter>
    );
  }  
}

export default App;
