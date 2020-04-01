import { AppController } from "./controller";
import { store } from "./store";
import { View } from "./view";
import { Template } from "./view/template";
import { ViewUtils } from "./view/utils";


console.log("TypeSafe store vanillajs example");

const template = new Template()

const view = new View(template)

const controller = new AppController(store, view)

const setRoute = () => controller.setRoute(document.location.hash)

ViewUtils.on(window, "load", setRoute)
ViewUtils.on(window, "hashchange", setRoute)