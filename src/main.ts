import { mountCountrySearch } from "./ui/countrySearchView.js";

const app = document.createElement("main");
app.id = "app";
app.className = "app-shell";
document.body.append(app);

mountCountrySearch(app);
