# Project: Realtor

## Project Overview
This project appears to be in its early stages of development. Based on the directory name, it is likely intended to be a real estate management or search application.

## Getting Started
python project.
create website with real estate listings on Hebrew.
listings example C:\Users\Michael\Downloads\listings_raw
analyze and structure data to help realtor to find listings.
create login page with captcha
create registration page with captcha with phone number confirmation by WhatsApp message using Green API
captcha timeout 300 sec
captcha should refresh if error in login / registration process.
data should be structured and saved in elastic search.
For each listing, identify: city, street, rooms, price (as integer), floor, total_floors, has_elevator (boolean), has_parking (boolean). Language: Hebrew.
Every WhatsApp message can contain more than one listing.
add admin page with ability to load .txt file with messages to parse them to elastic search
save user profiles to elastic search
for each user add ability edit his profile
login for user is by mobile phone number and password
for admin add ability to use cheapest ai model of chatgpt to assist in parsing data, batch mode to pay less.
admin phone +972546546855
password 90lomik1
should not be hardcoded, use elasticsearch database.
data.txt contains tokens and endpoints

### TODO:
- [x] Initialize the project (FastAPI backend, React frontend).
- [x] Define the technology stack (Python/FastAPI, React/TypeScript, Elasticsearch, OpenAI, Green API, Vanilla CSS).
- [x] Establish directory structure (`backend/`, `frontend/`).
- [x] Implement Hebrew RTL support.
- [x] Integrate Elasticsearch for listings and users.
- [x] Implement AI parsing for Hebrew listings (OpenAI).
- [x] Add WhatsApp-based registration flow (Green API).
- [x] Build Admin dashboard for listing uploads.
- [x] Implement Login/Registration with Captcha (300s timeout).
- [ ] Add more advanced property filtering.
- [ ] Implement property detail view page.
- [ ] Refine AI parsing prompts for higher accuracy.

## Development Conventions
- **Naming:** Use clear, descriptive names for files and variables.
- **Documentation:** Maintain this `GEMINI.md` as the project evolves to provide context for AI-assisted development.
- **Testing:** Prioritize test-driven development as the codebase grows.

## Key Files
- `GEMINI.md`: This file, providing instructional context for AI interactions.
