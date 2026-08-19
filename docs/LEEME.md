# docs/ — la carpeta que se publica

`index.html` es el prototipo entero en UN archivo: el mismo diseño,
con el runtime, el marco de iPhone y las imágenes metidos dentro. Se genera, no se
edita a mano — lo que se edita es `../project/`.

Existe porque una página publicada no puede pedir archivos sueltos al servidor: si
las imágenes siguieran en `assets/`, saldrían rotas.

Para regenerarlo hace falta node, ImageMagick y bajar tres librerías:

    mkdir -p lib img
    curl -o lib/react.js     https://unpkg.com/react@18.3.1/umd/react.production.min.js
    curl -o lib/react-dom.js https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js
    curl -o lib/babel.js     https://unpkg.com/@babel/standalone@7.29.0/babel.min.js
    for n in new-0823 new-0845 new-0859 new-0913 new-0925; do
      magick ../project/assets/$n.png -resize 750x -strip -quality 90 img/$n.jpg
    done
    for n in 1 2 3 4 5 6; do magick ../project/assets/stamp-c$n.png -resize 160x -strip img/stamp-c$n.png; done
    cp ../project/assets/emblem-alpha.png ../project/assets/qr-real.png img/
    P=../project SC=. node build.mjs

Del diseño solo se cambian las rutas de las imágenes por la imagen misma. Ni una
línea de layout, color o lógica.

GitHub Pages sirve esta carpeta tal cual: cada `git push` a `main` actualiza
https://josevergara1999.github.io/tarjeta-club-huemul/ en un par de minutos.
