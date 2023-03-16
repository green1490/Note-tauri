import { createApp } from "vue";
import "./styles.css";
import App from "./App.vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRightArrowLeft,
  faFolder,
  faGear,
  faFolderOpen,
  faSync,
  faEye,
  faEyeSlash,
  faCircleXmark
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(
    faArrowRightArrowLeft, 
    faFolder, 
    faGear, 
    faFolderOpen,
    faSync,
    faEye,
    faEyeSlash,
    faCircleXmark,
    );

createApp(App)
    .component("font-awesome-icon", FontAwesomeIcon)
    .mount("#app");
