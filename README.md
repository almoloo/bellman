# bellman
##### Get notified of cryptocurrency price changes.
[https://bellman.top](https://bellman.top)

![bellman](/screenshots/hero.png)
> This for a [contest on gitcoin](https://gitcoin.co/issue/3commas-io/3commas-official-api-docs/122/100027507), but the development will continue even after the conclusion of the contest. It was not tested thoroughly and is probably not suitable for production use yet. Please use with caution!
---
### Mobile screenshots
<div style="display:flex">
  <img src="/screenshots/1.PNG" alt="Homepage light" width="23%" />
  <img src="/screenshots/2.PNG" alt="Homepage dark" width="23%" />
  <img src="/screenshots/3.PNG" alt="List of coins" width="23%" />
  <img src="/screenshots/4.PNG" alt="Success message" width="23%" />
</div>

---
### Services used in the project
* [Binance API](https://binance-docs.github.io/apidocs/spot/en/#change-log) was used to retrieve coin prices periodically.
* [Flatfile](https://github.com/brendanashworth/flatfile) was used to store alerts' data but will be scraped and replaced with mongodb.

### Installation
1. Download and install node.js from [https://nodejs.org](https://nodejs.org)
1. Clone the project
  ```
    git clone https://github.com/almoloo/bellman
  ```
3. Cd into the cloned directory and install dependencies
  ```
    cd bellman
    npm install
  ```
4. Create new dotenv file in the root of the project with said variables
  ```
    touch .env
  ```
  ##### Environmental variables
  * PORT: The port you want the project to be run at
  * MAIL: The email address you want alerts to be sent from
  * MAIL_HOST: SMTP host address
  * MAIL_PORT: SMTP port
  * MAIL_USER: SMTP username
  * MAIL_PASSWORD: SMTP password
5. Start either the production or development server
  ```
    # Development
    npm run dev
    # Production
    npm start
  ```
6. Open your browser of choice and navigate to `http://localhost:3000/`
7. In order to rebuild the css file run the following command in the root of the project
  ```
    npx tailwindcss -i ./wwwroot/styles/src.style.css -o ./wwwroot/styles/style.css --watch
  ```

### License
Distributed under the MIT License. See [LICENSE](/LICENSE) for more information.

### Contact
Should you have any questions, feel free to reach me at [amousavig@icloud.com](mailto:amousavig@icloud.com)
