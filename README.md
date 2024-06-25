## TW-RoT

Intro
-------------------------------------------
Proiectul RoT pt TW, 2024, scris de Matei Chirvasa si Sabina Prodan.

Ghid folosire
-------------------------------------------
Pentru folosire, trebuie completate diversele field-uri in .env

Se pregateste o baza de date `Postgresql 16` cu un utilizator cu nume, parola, nume de baza de date, nume de schema `tw_rot`.

Se instaleaza `mkcert` si se genereaza fisierul localhost.pem, localhost-key.pem, si rootCA.pem care trebuie puse in folder-ul `back/common`

- In toate fisierele care contin un fisier package.json, trebuie rulat `npm i`
- Din folder-ul `scraper` se apeleaza `node index.js`.
- Din folder-ul `back` se apeleaza `node start.js`

Daca nu au fost modificate setarile din .env, web server-ul va rula pe localhost:12734.


Video
-------------------------------------------
[Video demonstrativ](https://youtu.be/gwOvNgEUhcE)
