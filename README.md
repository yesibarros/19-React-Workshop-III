# React IV

## Intro

### Preparación

Para la próxima fase de Juke, vamos a aprender como implementar el sistema `Redux` de manejo de estado a nuestra aplicación de React. Redux por si mismo es extremadamente una librería pequeña (podrías probablemaente escribirla tu mismo ahora), pero nos permite escribir aplicaciones con nu cierto set de principios en mente que, si nos adherimos a ellos, nos va a ayudar escribir UIs manejables predicibles y escalables.

### Example

Es útil pensar que lo que vamos a cambiar en nuestra aplicación vanilla de React una vez que agregamos Redux (y sus bindings, `React-Redux`).

#### Lo que va a cambiar:

- Donde reside nuestro estado
  - Nuestro estado no va a estar en nuestros componentes de React, en cambio, todo va ir en el `store` centralizado de Redux.
- Como cambia nuestro estado
  - Usar `setState` para cambiar directamente el estado del componente no va a pasar directamenteen las respuestas a interacciones y acciones, pero en cambio el `store` de Redux se va a actualizar y el estado del coponente va a `setState` cuando el `store` diga que fue actualizado.

---

#### Que no va a cambiar

- Nuestros componentes presentacionales
  - Si hicimos correctamente separar nuestros componentes presentacionales de nuestros contenedores, entonces nuestros componentes presentaciones deberías ser completamente reusables, sin importar que tipo de componente maneja su estado.
- El numero de formas de mutar el estado y disparar un render
    - Usando vanilla React, la única forma de efectuar un cambio en el estado y re-renderear es via `setState`. Con Redux, la unica forma de hacer eso es usando el método `dispatch` en el store.

```JSX
// solo React
import StatelessComponent from './StatelessComponent';

class ContainerComponent extends React.Component {
  constructor (props) {
    super(props);
    this.state = { counter: 0 };
    this.increment = this.increment.bind(this);
  }

  increment () {
    this.setState(prevState => ({ counter: ++prevState.counter }));
  }

  render () {
    const {counter} = this.state;
    return <StatelessComponent counter={counter} increment={this.increment} />
  }
}
```

```JSX
// React con Redux
import store from './store';
import {incrementCounter} from 'action-creators';
import StatelessComponent from './StatelessComponent';

class ContainerComponent extends React.Component {

  constructor (props) {
    super(props);
    this.state = store.getState();
  }

  componentDidMount() {
      this.unsubscribeFromStore = store.subscribe(() => {
         this.setState(store.getState());
      });
  }

  componentWillUnmount() {
      this.unsubscribeFromStore();
  }

  increment () {
    store.dispatch(incrementCounter());
  }

  render () {
    const {counter} = this.state;
    return <StatelessComponent counter={counter} increment={this.increment} />
  }
}
```

Esto puede parecer, a primera vista, como más trabajo y código más complejo. Estoy de acuerdo! Pero una vez que nuestra app empieza a ser más grande, te vas a dar cuanta que algo importante: si haces cosas de la forma de Redux, nuestra app va a volverse más y más grande, pero no se va a volver substancialmente más compleja.

Para hacer una analogía a las matemáticas, pensemos las aplicaciones Redux como si tuvieran una complejidad logarítmica: Hay un poco más de trabajo al principio, pero luego la dificultad de entender como funciona el app rápidamente se equilibra y solo incrementa en pequeñas cantidades a medida que el tamaño de nuestra app crece. Usando vanilla React, diríamos que la complejidad de nuestra app es lineal, cuando crece, va a ser igual la complejidad de entenderlo. Sin embargo, si usaramos un sistema orientado a objetos en vez de un sistema funcional, diría que la complejidad se volvería quadratica, a medida que nuestra app crece, se va a volver sustancialmente más difícil de entender por la cadena de efectos secundarios que necesitamos manejar.

### Punto de Inicio

1. Forkea y cloná [este repo](http://github.com/atralice/react-workshop-IV)
2. Corré npm install

## Construyendo Busqueda de Lyrics

### ¿Qué dice?

Mucho de este workshop va a ser reorganizar y refactorear funcionalidad existente, así que va ser lo mejor hacer nuestra primer parte de Redux en un feature nuevo.

En este punto de inicio de la parte 4, se ha añadido una nueva ruta a el servidor `/api/lyrics/:artist/:song`. Esta ruta va a usar un paquete npm separado para buscar los lyrics de la cancion del internte, y responder con un request con `{ lyric: String }` como información, donde `String` son los lyrics de una canción por una artista dado. Anda a `http://localhost:1337/api/lyrics/imogen%20heap/hide%20and%20seek` para ver la respuesta.

Esta va ser nuestra fuente de información para nuestra primer excursión usando Redux.

### Definiendo la Estructura de Archivos

Antes que continuemos, hagamos toda la creación de archivos para los siguientes pasos en el camino.

Actualmente, deberías tener un directorio `react` con dos subdirectorios (`components` y `containers`) y nuestro `index.js`.

Agreguemos dos nuevos archivos directamente en el directorio `react` llamado `store.js` y `constants.js`. Pueden estar vacios por ahora, vamos a trabajar en ellos en los próxiomos pasos.

Creemos dos nuevas carpetas directamente a nuestro directorio (en el mismo nivel donde estan `components` y `containers`) llamado `action-creators` y `reducers`. Colocá un `root-reducer.js`dentro de `reducers`y un `lyrics.js` dentro `action-creators`.

### Action Types

Pensemos en las acciones que un usuario puede tomar para cambiar la UI. Podemos definirlos con un set de string constants llamados `action types`. Este es realmente un gran aspecto de usar Redux, a pesar que parezca extraño e innecesario al principio. Todas los eventos posibles que van a afectar lo que es eventualmente nuestro estado Redux global son dados un nombre, esto es lo que llamamos `action type`.

Digamos que queremos tener un botón para que un usuario remueva una cancion de un album. Podemos definir una acción como `const REMOVE_SONG = 'REMOVE_SONG';` (Por convención, nuestras constantes son guardadas en variables en mayuscula).

Volviendo a nuestro feature de lyrics, la unica acción real que queremos considerar por ahora es setear el texto de los lyrics. En una de nuestros archivos nuevos, `constants.js`, agreguemos la siguiente linea:

```js
export const SET_LYRICS = 'SET_LYRICS';
```

Ahora hemos definido el primer tipo de una acción que podemos enviar a nuestro estado de Redux. Todos los futuros action types van a ir también en este archivo con la misma fachada. A continuación, vamos a usar este tipo en un action creator.

### Action Creators

Ahora que tenemos un action type definido en nuestras `constants.js`, hagamos uso de ese tipo en lo que es conocido como un _action creator_.

La diferencia entre un _action type_ y un _action creator_ puede ser confusa. _Action types_ son una definicion y una etiqueta para un tipo de acción. _Action creators_ son funciones que pueden tomar información y retornar objetos que estan formateados para ser enviados al estado de Redux. Estos objetos son llamados _actions_ y siempre tienen la propiedad `type` que describe que tipo de acción son.

En `lyrics.js`, localizado en el directorio `action-creators`, escribamos y exportemos una función llamada `setLyrics`, el cual reciba un string (quizás llamado `text`?) y retorne un objeto con dos propiedades:

- `type`, que debería ser igual a la variable `SET_LYRICS` importada de `constants.js`
- `lyric`, igual a el string que fue pasado a la función. Esto es usualmente referido como el `payload` de la acción, para distinguirlo del `type`.

|||
```js
import { SET_LYRICS } from '../constants';


export const setLyrics = function (text) {
  return {
    type: SET_LYRICS,
    lyric: text
  };
};
```
|||

### Reducers

Ahora necesitamos describir como nuestro estado va a cambiar cuando recibe una acción. Con React plano, usabamos `setState`. Con Redux, le pasamos una acción a el método `dispatch` del store, y el store ejecuta su función `reducer`. La función reducer tiene la siguiente firma:

```js
function reducer (prevState, action) {
  return newState;
}

```

Le pasamos el estado que estamos por reemplazar con el efecto de una acción y el objeto que retornamos describen un nuevo estado que nuestra app va a usar para re-renderizar.

Típicamente, el reducer consiste de una declaración `switch`que describe una actualización distinta dependiendo del tipo de acción. En este caso, tenemos una acción esperada, `SET_LYRICS`. Si la `action.type` no es `SET_LYRICS`, deberíamos solo retornar el estado antes de la acción.

**RECORDÁ**: es EXTREMADAMENTE importante que el reducer sea una función pura. Esto significa que tenés que seguir dos reglas:

1. Un input siempre retorna el mismo output
2. No tiene efectos secundarios (AJAX, mutar data, etc).

Veremos mas razones de porque es importante luego, pero por ahora pensalo de esta forma: nuestro estado es lo esencial de nuestra app, así que cualquier cambio a él debería ser lo más predicible y debuggeable posible.

|||
```js
import {SET_LYRICS} from '../constants';

const initialState = { text: '' };

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case SET_LYRICS: 
       return Object.assign({}, state, { text: action.lyric });
    default: 
       return state;
  }
}
// Dos cosas para notar: 
//   1. Usamos Object.assign para mantener inmutabilidad.
//      Dado que nuestro estado solo tiene una propiedad en él, no importa mucho, ¿pero qué pasaría si añadieramos más?
//   2. Si recibimos una acción que no tiene un tipo que resconozcamos, retornamos el state previo.
```
|||

### El Store

Notaste algo interesante? No hemos instalado `redux` aún! Solo hemos escrito JavaScript plano. Todo lo que `redux` va a hacer es ofrecernos un par de funciones helper. Instalemoslo:

`npm install --save redux`

Ahora es tiempo de conectar todo con nuestro comando central - el `store`. El store contiene el objeto representando el estado de nuestra aplicación (accesible via `store.getState`), y contiene el único método capaz de cambiar ese estado (`store.dispatch`).

[Crea el store](https://redux.js.org/docs/basics/Store.html) en tu archivo `store.js` usando tu reducer. Exporta tu store creado.

|||
```js
import { createStore } from 'redux';
import reducer from './reducers/root-reducer';

export default createStore(reducer);
```
|||

### Recap

Los pasos previos pueden haber pasado rapido, así que tomemonos un segundo para entender que hemos hecho.

Tenemos cuatro componentes principales en nuestro store de Redux:

- Action Types: Estos son esencialmente etiquetas de las diferentes tipos de acciones que pueden ingresar a nuestro store. Las definimos y usamos estas etiquetas desde `constants.js` así nos podemos mantener consistentes y nuestro editor puede hacer uso del nombre de variables en vez de strings simples.
- Action Creators: Estas son funciones que producen acciones, objectos con una propiedad `type y, usualemente, pero no siempre, otra información. Estos son objetos que van a ser dispatcheados al store.
- Reducers: Una función que recibe el estado previo del store y el objeto de una acción. El reducer debería luego leer el `type` del objeto de la acción y decidir cual debería ser el proximo estado. El estado anterior no debería verse afectado en ninguna forma, el nuevo estado creado debería ser un estado completamente nuevo.
- Store: El componente central de Redux, el store es el que va a poseer el estado y nuestro canal para generar y reaccionar a cambios en el estado.

Lo que has seteado hasta ahora debería servir como un patrón para cualquier cosa que hagas con Redux luego de este punto. Date cuenta que React no ha jugado un papel para nada. Esto es un hecho que es usalmente olvidado. Redux por si misma no tiene una relación directa con React: puede ser usado totalmente independientemente. Si sucede que es una gran herramienta para usar en grandes apps de React.

### Interactuá y Escuchá

Usemos Redux y nuestro store sin React para probar lo que hemos seteado hasta ahora. En nuestro archivo `index.js`, pegá el siguiente código. Podés comentar todo nuestra configuración de React/React-Router, pero no es necesario:

```js
import store from './store';
import {setLyrics} from './action-creators/lyrics';

console.log('-------------------------');
console.log('El estado antes de cualquier acción: ', store.getState());

const seminareAction = setLyrics('Quiero ver quiero entrar nena nadie te va a hacer mal.... excepto amarte...');
store.dispatch(seminareAction);

console.log('-------------------------');
console.log('Estado luego de primer SET_LYRICS action:', store.getState());

const rickRollAction = setLyrics('Never gonna give you up, never gonna let you down');
store.dispatch(rickRollAction);

console.log('-------------------------');
console.log('Estado luego del segundo SET_LYRICS action: ', store.getState());
```

En el código de arriba, usamos el método `dispatch` del `store` para enviar el objeto de una acción a nuestro store, el cual va a ser recibido por nuestro reducer y usado para generar nuestro próximo estado. Llamamos otro método en nuestro store, `getState`, para obtener acceso a ese store. También podemos preguntar por el estado antes de cualquier acción sea dispatchada, en ese caso usamos nuestro `initialState`.

Otro método que podemos usar sabiendo sobre el cambio de estado es el método `subscribe` en nuestro store. Para un efecto similar al código de arriba:

```js
import store from './store';
import {setLyrics} from './action-creators/lyrics';

const unsubscribe = store.subscribe(function () {
    console.log('----------------');
    console.log('Cambio el Estado!!', store.getState());
});

store.dispatch(setLyrics('Quiero ver quiero entrar nena nadie te va a hacer mal.... excepto amarte...'));
store.dispatch(setLyrics('Never gonna give you up, never gonna let you down'));

unsubscribe();

store.dispatch(setLyrics('Hello, darkness, my old friend.'));
```

En el código de arriba, registramos una función para que sea llamada cuando nuestro estado se actualiza. Vemos dos versiones de nuestro estado loggeadas. Llamar `subscribe` retorna una función que puede ser usada para remover nuestro listener del store, llamada usualmente desuscribirse. En este casom un cambio en el estado luego de invocar `unsubscribe` no dispara ningún loggeo.

### Redux Dev Tools

Instalá el [Redux DevTools Chrome Extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en) 

Luego, como indican [las instrucciones aquí](https://github.com/zalmoxisus/redux-devtools-extension#11-basic-store), modificá tu nuevo store para que este "instrumentado" con estas herramientas. El signo de `+` es solo la forma de github de mostrar que nua linea fue añadida en una diferencia (lo cual es también porque la linea esta pintada en verde). Lineas borradas estan en rojo y con un signo de menos. Asegurate que no hayas copiado el signo de más al comienza de la linea o tu motor de JS va a tratar de cohercionar el valor retornado por `window.__REDUX_DEVTOOLS_EXTENSION__()` a un número antes de pasarlo al método `createStore`, y vas a tener un mal momento.

Vas a saber que funciona si abrís las dev tools de Chrome, clickeas en "Redux", y ves un UI completo, en vez del mensaje "no store found".


## Conectando a la Vista

### Intro

Ahora que tenemos nuestro store de Redux colocado, traigamos React y nuestra vista a la imagen.

La trayectoria para los siguientes pasos son:

- Crear un componente `LyricsContainer` que se suscriba y dispatchie acciones a nuestro store, y use el valor del estado en el store. Integrando este componente con React Router y nuestro `Sidebar` lo va a ser accesible
- Crear el componente presentacional `Lyrics` que no sabe nada sobre el store o acciones. Este componente va a mostrar los lyrics y manejar un input para que el usuario use para buscar.
- Usar el componente `Lyrics` dentro de `LyricsContainer` para pasar funciones e información del estado del store.

### LyricsContainer es Inteligente

Hemos trabajado con componentes que hemos definido como "containers". Son llamados así porque son considerados "inteligentes", saben sobre y afectan  el estado de nuestra aplicación. Otros componentes, "tontos", son simplemente una función de sus props, y no controlan o mantienen estado adicional.

Con Redux ahora, pensamos en nuestros componentes "container" como componentes que saben sobre e interactuan con el store de Redux.

Definamos un nuevo componente en nuestro directorio `containers` llamado `LyricsContainer`. Este debería ser una clase para que podamos acceder al estado del componente y a sus lifecycle hooks.

- En el `constructor` de este componente, setiemos el estado inicial del componente al valor del estado del store, usando `getState()`.
- En el `componentDidMount` del componente, suscribite a el store y llamá `setState` con el estado del store cuando el store se actualiza. Llamar `subscribe` va a también retornar una función que deberíamos guardar en `this.unsubscribe`.
- En el `componentWillUnmount` de este componente, invoquemos `this.unsubscribe` en orden de deregistrar nuestro listener y prevenir errores/memory leaks.
- En el `render` del componente, devolve algun elemento por ahora (como `<h1>Solo un contenedor, más esta por venir!<h1>`). Vamos a remplazar esto con nuestro componente `Lyrics` pronto.
- Como siempre, exporta este componente del archivo.

Finalmente, **añadí una nueva `<Route>` dentro de nuestro componente `Main` que renderice este componente**. Colocar un nuevo `<Link>` en `Sidebar` sería lindo también.

|||
```JSX
import React, {Component} from 'react';
import store from '../store';

export default class extends Component {

  constructor() {
    super();
    this.state = store.getState();
  }

  componentDidMount() {
    this.unsubscribe = store.subscribe(() => {
      this.setState(store.getState());
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    return (
      <h1>Solo un contenedor por ahora!</h1>
    );
  }

}
```
|||

### Lyrics es Tonto

Nuestro componente `Lyrics` va a ser *muy tonto*.

Define `Lyrics` en el directorio `components` como un componente tonto y no te olvides de exportarlo!

Debería tener dons elementos significativos:

- Un `<input>` para tipear el artista a buscar
- Un `<input>` para tipear la canción a buscar
- Un `<pre>` para mostrar los lyrics de una canción (`<pre>` preserva los saltos de linea).
- Un `<button>` que va a disparar un submit.

Debería esperar recibir seis `props` importantes:

- `text`: Posiblemente un string de lyrics para mostrar, pero podría ser `null`
- `setArtist`: Una función que debería ser invocada con el artista que va a ser buscado.
- `artistQuery`: El valor actual del artista a ser buscado.
- `setSong`: Una función que debería ser invocada con la canción que va a ser buscada.
- `songQuery`: El valor actual de la canción que va ser buscada.
- `handleSubmit`: Una función que debería ser invocada cuando vayamos a buscar.

|||
```JSX
import React from 'react';

export default function (props) {

  const artistChange = e => {
    props.setArtist(e.target.value);
  };

  const songChange = e => {
    props.setSong(e.target.value);
  };

  return (
    <div id="lyrics">
      <form onSubmit={props.handleSubmit}>
        <div>
          <input type="text" value={props.artistQuery} placeholder="Artist" onChange={artistChange}/>
          <input type="text" value={props.songQuery} placeholder="Song" onChange={songChange}/>
        </div>
        <pre>{props.text || 'Search above!'}</pre>
        <button type="submit">Search for Lyrics</button>
      </form>
    </div>
  );

}
```
|||

### Manejando el Input

Ahora que tenemos nuestro componente presentacional `Lyrics`, integremoslo con nuestro `LyricsContainer`.

Primero, en nuestro `constructor()`, actualicemos el estado inicial de nuestro nuestro componente para que también incluya `artistQuery` y `songQuery`. Esto va a guardar los valores de inputs para submitearlo después.

Segundo, crea las funciones del componente `setArtist` y `setSong` que va le vamos a pasar a `Lyrics`. EL cuerpo de esta función debería `setState` a las locales del componente, `artistQuery` y `songQuery` respectivamente. Asegurate de bindear estas funciones en el constructor!

Tercero, crea una función del componente `handleSubmit`. Hacé que por ahora loggie el estado. La vamos a llenar en nuestro proximo paso.

Finalmente modifica la función `render()`para producir un componente `Lyrics`, pasandole las seis props esperadas. (`text`, `setArtist`, `setSong`, `artistQuery`, `songQuery` y `handleSubmit`). Algunas de estas se van a originar desde `this.state`, y otras no.

|||
```JSX
import React, {Component} from 'react';
import store from '../store';
import Lyrics from '../components/Lyrics'

export default class extends Component {

  constructor() {

    super();

    this.state = Object.assign({
      artistQuery: '',
      songQuery: ''
    }, store.getState());

    this.handleArtistInput = this.handleArtistInput.bind(this);
    this.handleSongInput = this.handleSongInput.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = store.subscribe(() => {
      this.setState(store.getState());
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  handleArtistInput(artist) {
    this.setState({ artistQuery: artist });
  }

  handleSongInput(song) {
    this.setState({ songQuery: song });
  }

  handleSubmit() {
    // Proximamente...
  }

  render() {
    return <Lyrics
      text={this.state.text}
      setArtist={this.handleArtistInput}
      setSong={this.handleSongInput}
      artistQuery={this.state.artistQuery}
      songQuery={this.state.songQuery}
      handleSubmit={this.handleSubmit}
    />
  }

}
```
|||


### Dispatch!

Es finalmente el momento de usar nuestro `setLyrics` action creator y afectar el store/state de Redux.

Importemos nuestra función `setLyrics` desde `action-creators/lyrics.js`. Esto nos va a dar la acción del objeto que vamos a necesitar para dispatchear una vez que tengamos los lyrics.

Luego, importemos `axios` para que podamos hacer algo de AJAX.

Tercero, completemos la función `handleSubmit`. Cuando submitiemos, deberíamos hacer un pedido AJAX GET a nuestra ruta de lyrics (`/api/lyrics/:artist/:song`). Usa `this.state.artistQuery` y `this.state.songQuery` para rellenar los parametros. Una vez que recibimos una respuesta, la propiedad `data` de la respuesta va a ser un objeto con una propiedad `lyric`. Este es el texto que necesitamos para crear una acción y dispatchear!

Usa `setLyric` para crear una acción del texto del lyric, y finalmente, usa el nuestro stroe para `dispatch`ear la acción!

Dado que ya tenemos nuestro componente suscrito a cambios del store, y pasandole la propiedad `text` a `Lyrics`, deberíamos ver el efecto completo de nuestra página `Lyrics`. Si no, trabaja a través de los pasos anteriores para asegurarte que todo esta en su lugar, debuggea.

||| 
```JSX
import React, {Component} from 'react';
import Lyrics from '../components/Lyrics';
import axios from 'axios';

import {setLyrics} from '../action-creators/lyrics';
import store from '../store';

export default class extends Component {

  constructor() {

    super();

    this.state = Object.assign({
      artistQuery: '',
      songQuery: ''
    }, store.getState());

    this.handleArtistInput = this.handleArtistInput.bind(this);
    this.handleSongInput = this.handleSongInput.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.unsubscribe = store.subscribe(() => {
      this.setState(store.getState());
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  handleArtistInput(artist) {
    this.setState({ artistQuery: artist });
  }

  handleSongInput(song) {
    this.setState({ songQuery: song });
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.state.artistQuery && this.state.songQuery) {
      axios.get(`/api/lyrics/${this.state.artistQuery}/${this.state.songQuery}`)
        .then(response => {
          const setLyricsAction = setLyrics(response.data.lyric);
          store.dispatch(setLyricsAction);           
        });
    }
  }

  render() {
    return <Lyrics
      text={this.state.text}
      setArtist={this.handleArtistInput}
      setSong={this.handleSongInput}
      artistQuery={this.state.artistQuery}
      songQuery={this.state.songQuery}
      handleSubmit={this.handleSubmit}
    />
  }

}
```
|||

### Mira a Tu Reino

El verdadero proposito y caso de uso de Redux toma un tiempo en florecer. Toma bastante tiempo y espacio de código. Ahora mismo, estamos usando nuestro Redux store para solo una pieza de información (texto de lyrics), pero hemos establecido casi un patrón completo para mover el resto deñ estado global de nuestra aplicación a un solo lugar.

Esta es una realidad de usar Redux y es importante de entender. Inicialmente, el boilerplate se va a sentir incomodo y cuestionable. El argumente se puede hacer muy convencido que usar Redux en una pequeña aplicación como Juke es innecesariamente complejo!

Sin embargo, una vez que el boilerplate fue establecido y practicado, hace a el proceso de escalar la base del código mucho menos doloroso y mucho mas fácil de entender y mantener rastro.

Haz hecho mucho hasta ahora! Toma un momento para disfrutar tu propia grositud. Se siente bien?

## Nuevos Conceptos

### Tu Reino tiene un Anti-Pattern

Bienvenido de vuelta, persona grosa.

Desafortunadamente, te hemos llevado a un anti-pattern. Esta es: la locación de la lógica para buscar los song lyrics del servidor y dispatchearlo. Esto funciona bien y sigue el patrón que haz aprendido hasta ahora para interactuar con un servidor via AJAX; sin embargo, tenemos forma mucho mas escalable, reusable y testeable forma de hacer ahora.

Primero tenemos que aprender sobre middlewares...

### Middleware

Una vez que invocamos `store.dispatch` con una acción (preferiblemente retornada a nosotros por un action creator), ¿qué le pasa a ella? Dos cosas: La acción pasada al reducer del store por supuesto, pero antes que pase la acción va a ir a través de cualquier `middleware` que hayamos registrado con el store. Esto es muy similar a la forma que un objeto `request` va a pasar a través de un middleware en Express antes de llegar a su endpoint!

La función `createStore` de Redux acepta middlewares como su segundo argumento. Veamos como funciona usando uno de los mas populares middlewares disponibles: `redux-logger`!

1. `npm install --save redux-logger`
2. En `store.js`, importá una función helper de redux llamada `applyMiddleware`.
3. `import { createLogger } from 'redux-logger`
4. `applyMiddleware` acepta un numero de middlewares como argumentos - pasale el `createLogger` ejecutado a `applyMiddleware`
5. Pasa el resultado de `applyMiddleware` a el ultimo argumento de `createStore`. **NOTA**: Si tenes Redux devtools vas a necesitar referirte a [las instrucciones más avanzadas aquí](https://github.com/zalmoxisus/redux-devtools-extension#12-advanced-store-setup).

Ahora, refreshea la página para dispatchear tu acción `SET_LYRICS` otra vez (buscando). Chequeá tu consola. Vamos a ver un output loggeado para cada acción que es enviada a nuestro store, como también información sobre el estado anterior y siguiente. Muy copado, no?

### redux-thunk

Introduzcamos una segunda pieza de middleware que nos va a ayudar a lidear con acciones asincrónicas y efectos secundarios: `redux-thunk`!

`npm install --save redux-thunk`

Importá `thunkMiddleware` de `redux-thunk` y pasalo como otro argumento a `applyMiddleware`.

Recuerda que todas las acciones que son dispatcheadas pasan por nuestros middleware antes que corran a través del reducer. Normalmente, nuestro reducer espera una acción que sea un objeto JavaScript plano con un campo type. Sin embargo, thunk middleware nos va a dar una poderosa nueva habilidad: en vez de dispatchear una acción, podemos dispatchear una **nueva función**! Cuando el `thunkMiddleware`vea que hemos dispatcheado una función en vez de un objeto regular, va a decir:

_Mmm, parece que quien sea que haya dispatcheado esta función esta tratando de hacer algo asincrónico - Tomare esta función que me han dado y en vez de darsela a mi reducer, la voy a invocar aquí y pasarle el dispatch del store a el, para cualquiera que sea el efecto secundario se completa o la acción asyncrónica se resuelve, lo pueden usar para dispatchear una nueva acción con cualquier dato que reciban. (y como una buena medida, les pasare el `getState` del store también).

Que pedazo de middleware tan útil! Ahora tenemos un lugar para colocar todos nuestros efectos secundarios y AJAX requests - `async action creators`!

### Refactoreando la Busqueda de Lyrics 

Todas nuestras action creators sincónicas retornaban un objeto JavaScript. Nuestras async action creators, posibilitado por `thunkMiddleware`, va a retornar una función en cambio. Esta función puede esperar recibir dos argumentos: el método `dispatch` y `getState` del store. Con esto, podemos hacer efectos secundarios, y luego dispatchear los resultados a nuestros action creators regulares cuando esten listos. Aquí hay unos ejemplos:

```js
export const setLyrics = function (text) {
  return {
    type: SET_LYRICS,
    lyric: text
  };
};

export const fetchLyrics = function (artist, song) {
  return function (dispatch, getState) {
    axios.get(`/api/lyrics/${artist}/${song}`)
      .then(res => {
        dispatch(setLyrics(res.data.lyric));
      });
  };
};


const fetchAlbumsFromServer =() => {
  return dispatch => {
    axios.get('/api/albums')
      .then(res => res.data)
      .then(albums => dispatch(receiveAlbumsFromServer(albums))); 
  }
}

const playSong = songId => {
  return dispatch => {
    // efectos secundarios, como usar un elemento audio pertenecen a async action creators también, incluso aunque no sean "async"
    audio.play() 
    dispatch(selectSong(songId));
  }
}

const doSeveralThings = (stuffId, thingsId) => {
  return dispatch => {
    // También podemos usar async action creators para componer varias acciones a una!
    dispatch(doStuff(stuffId));
    dispatch(doThing(thingId));
  }
}
```

Ahora podemos escribir un async action creator como el de arriba para abstraer nuestros pedidos AJAX! Remplaza el llamado AJAX y la action creator sincrónico en tu `LyricsContainer handleSubmit()` con un nuevo async action creator `fetchLyrics`.

|||

```js
// En action-creators/lyrics.js
export const fetchLyrics = function (artist, song) {
  return function (dispatch, getState) {
    axios.get(`/api/lyrics/${artist}/${song}`)
      .then(res => {
        dispatch(setLyrics(res.data.lyric)); 
      });
  };
};
```

```js
// En LyricsContainer.js
handleSubmit() {
  if (this.state.artistQuery && this.state.songQuery) {
    store.dispatch(fetchLyrics(this.state.artistQuery, this.state.songQuery));
  }
}
```
|||

## El Gran Refactoreo

### Organizandonos

Juke es una aplicación no-trivial, incluso solo considerando el front-end. Esto puede hacer un refactoreo tan grande parezca bastante intimidante. Veamos lo que existe y lo que será hecho.

##### Lo Que Existe:

- Un increible, sin fallas lyrics feature hecho con React y Redux
- Un `Main` gigantesco que contiene la mayor parte de nuestras funciones e interacciones con el estado
- Player
- La vista de todos los albumes y de un solo album
- La vista de todos los Artistas
- La vista de un solo artista con los albumes y las canciones anidadas.
- Sidebar con información de Playlists
- La vista para agregar una nueva playlist

Eso es bastante! Por suerte les traje esto:

```js
// ******Lyrics******
export const SET_LYRICS = 'SET_LYRICS';

// Albums
export const RECEIVE_ALBUMS = 'RECEIVE_ALBUMS';
export const RECEIVE_ALBUM = 'RECEIVE_ALBUM';

// Artists
export const RECEIVE_ARTISTS = 'RECEIVE_ARTISTS';
export const RECEIVE_ARTIST = 'RECEIVE_ARTIST';

// Playlists
export const RECEIVE_PLAYLISTS = 'RECEIVE_PLAYLISTS';
export const RECEIVE_PLAYLIST = 'RECEIVE_PLAYLIST';

// Songs
export const RECEIVE_SONGS = 'RECEIVE_SONGS';

// Player
export const START_PLAYING = 'START_PLAYING';
export const STOP_PLAYING = 'STOP_PLAYING';
export const SET_CURRENT_SONG = 'SET_CURRENT_SONG';
export const SET_LIST = 'SET_LIST';
export const SET_PROGRESS = 'SET_PROGRESS';
```

Arriba estan todos los tipos de acciones que vas a necesitar para refactorear el estado global de Juke a 100% Redux. Reemplazá tu `constants.js`actual con este archivo. Va a ser una guia excelente para continuar. También, ahora es un gran momento para hacer un `git commit`!

### Primeros Pasos

El componente más jugoso es definitivamente el player. Empecemos nuestro viaje de refactoreo aquí.

La forma del estado inicial de nuestro Player se ve como esto:

```js
{
  currentSong: {},
  currentSongList: [],
  isPlaying: false,
  progress: 0
}
```

Podemos añadir esta información a nuestro reducer actual, pero eso trae la pregunta: a medida que nuestra aplicación crece, vamos a colocar cada acción posible en un solo reducer?

No.

No, lo vamos a hacer.

### Composición del Reducer

Lidear con una declaración `switch` masiva se volvería muy confusa rápidamente. Afortunadamente, Redux viene con una bonita utilidad llamada [`combineReducers`](https://redux.js.org/docs/api/combineReducers.html) que podemos usar para mergear un set de reducers más pequeños que solo manejan un solo campo del estado a un solo gran reducer.

Vamos a recablear la situación actual de nuestro reducer un poco.

Renombrá tu archivo `reducers/root-reducer.js` a `lyrics-reducer.js. También, crea un nuevo archivo en `reducers` llamado `player-reducer.js`. Estos reducers van a ser responsable de reaccionar a acciones y manejar propiedades del estado relevantes a su feature específico.

Usa el siguiente código en tu `player-reducer.js`. Tomate tu tiempo para leer a través de él y entender cada linea. Vas a añadir más al archivo pronto.

```js
import {
  START_PLAYING,
  STOP_PLAYING
} from '../constants';

export const initialPlayerState = {
  currentSong: {},
  currentSongList: [],
  isPlaying: false,
  progress: 0
};

export default function (state = initialPlayerState, action) {

  const newState = Object.assign({}, state);

  switch (action.type) {

    case START_PLAYING:
      newState.isPlaying = true;
      break;

    case STOP_PLAYING:
      newState.isPlaying = false;
      break;

    default:
      return state;

  }

  return newState;

}
```

Ahora que tenemos un reducer para el estado y acciones de lyrics y otro para las de player, combinemoslo en orden de crear un nuevo root reducer. En `store.js`, importa ambos reducers, lyrics y player, y también importa la función `combineReducers` de Redux. Hace tu primer argumento a `createStore` que se vea así:

```js
combineReducers({
  lyrics: lyricsReducer,
  player: playerReducer
});
```

Este estado manejado por estos reducers ahora va a estar disponible en el estado del store en las propiedades `lyrics` y `player`. Anda a la página de lyrics, buscá, y mirá en la consola. Deberías ver el fruto de tus esfuerzos en la forma de estas dos propiedades.

Esto también a introducido un bug con tu feature lyrics -- los lyrics ya no se muestran! El arreglo debería ser bastante simple, fijate si lo podés encontrar.

+++El arreglo
`this.state.text` ahora debería ser `this.state.lyrics.text`!
+++

### Reimplementando `Player`

Vayamos a través de un ejemplo solo re-implementando play y pausa en Redux (vamos a ignorar actualizar la progress bar por ahora). Tratá de hacer cada paso por tu cuenta antes de chequear las soluciones, pero sentite libre de chequearlas luego de asegurarte que estas en el camino correcto!

- Identificá el estado y comportamiento que necesitas mover a Redux

|||
Chequeá el `Main.js`. Si seguimos los métodos que controlan reproducir y pausar, podemos ver el estado y comportamiento requerido:

```js
  start(song, songs) {
      this.setState({ selectedSong: song, currentSongList: songs })
      this.loadSong(song.audioUrl);
    }

  loadSong(audioUrl) {
    audio.src = audioUrl;
    audio.load();
    this.play();
  }

  play() {
    audio.play();
    this.setState({ isPlaying: true })
  }

  pause() {
    audio.pause();
    this.setState({ isPlaying: false })
  }
  
  findSongIndex() {
    return this.state.currentSongList.findIndex(song => song.id === this.state.selectedSong.id);
  }

  next() {
    let index = this.findSongIndex() + 1;
    if (index >= this.state.currentSongList.length) {
      index = 0 
    }
    const song = this.state.currentSongList[index];
    this.setState({ selectedSong: song })
    this.loadSong(song.audioUrl)
  }

  previous() {
    let index = this.findSongIndex() - 1;
    if (index < 0) {
      index = this.state.currentSongList.length - 1 
    }
    const song = this.state.currentSongList[index];
    this.setState({ selectedSong: song })
    this.loadSong(song.audioUrl)
  }

```

De esto, podemos ver que necesitamos manejar en el estado:
- isPlaying
- currentSong
- currentSongList

Y vamos a necesitar definir el siguiente comportamiento:
- play
- pause
- loadSong
- start
|||

- Chequeá nuestro archivo `constants.js` para los tipos de acciones para las distintas acciones que el usuario puede tomar. Estas pueden corresponder para cada vez que usamos setState en nuestros métodos de arriba.

```js
export const START_PLAYING = 'START_PLAYING';
export const STOP_PLAYING = 'STOP_PLAYING';
export const SET_CURRENT_SONG = 'SET_CURRENT_SONG';
export const SET_LIST = 'SET_LIST';
```

- Escribí action creators SINCRÓNICOS para retornar nuestras acciones. Todo lo que esto debería hacer es retornar el objeto de una acción con un type y un payload.

|||
```js
const startPlaying = () => ({ type: START_PLAYING });

const stopPlaying = () => ({ type: STOP_PLAYING });

const setCurrentSong = (currentSong) => ({ 
  type: SET_CURRENT_SONG,
  currentSong
});

const setCurrentSongList = (currentSongList) => ({ 
  type: SET_LIST,
  currentSongList
});

```
|||

- Escribi action creators ASINCRÓNICOS que van a hacer capaces de manejar los efectos secundarios (como llamar un método en nuesto elemento audio). PISTA: todos los métodos que tenemos en nuestro componente de arriba pueden ser re-escritos como async action creators

|||
```js
export const start = (song, list) => (dispatch) => {
  dispatch(setCurrentSong(song));
  dispatch(setCurrentSongList(list))
  dispatch(loadSong(song.audioUrl));
}

export const loadSong = audioUrl => (dispatch) => {
  audio.src = audioUrl;
  audio.load();
  dispatch(play());
}

export const play = () => (dispatch) => {
  audio.play();
  dispatch(startPlaying());
}

export const pause = () => (dispatch) => {
  audio.pause();
  dispatch(stopPlaying());
}

const findSongIndex = (currentSongList, currentSong) => {
  return currentSongList.findIndex(song => song.id === currentSong.id);
}

export const next = () => (dispatch, getState) => {
  const { currentSongList, currentSong } = getState().player
  let index = findSongIndex(currentSongList, currentSong) + 1;
  if (index > currentSongList.length - 1) {
    index = 0 
  }
  const song = currentSongList[index];
  dispatch(setCurrentSong(song));
  dispatch(loadSong(song.audioUrl));
}

export const previous = () => (dispatch, getState) => {
  const { currentSongList, currentSong } = getState().player
  let index = findSongIndex(currentSongList, currentSong) - 1;
  if (index < 0) {
    index = currentSongList.length - 1 
  }
  const song = currentSongList[index];
  dispatch(setCurrentSong(song));
  dispatch(loadSong(song.audioUrl));
}
```
|||

- Actualiza tu player reducer para cada para cada pedazo del estado que movemos a Redux.

|||
```js
import {
  START_PLAYING,
  STOP_PLAYING,
  SET_CURRENT_SONG,
  SET_LIST
} from '../constants';

export const initialPlayerState = {
  currentSong: {},
  currentSongList: [],
  isPlaying: false,
  progress: 0
};

export default function (state = initialPlayerState, action) {

  const newState = Object.assign({}, state);

  switch (action.type) {

    case SET_CURRENT_SONG:
      newState.currentSong = action.currentSong;
      break;

    case SET_LIST:
      newState.currentSongList = action.currentSongList;
      break;

    case START_PLAYING:
      newState.isPlaying = true;
      break;

    case STOP_PLAYING:
      newState.isPlaying = false;
      break;

    default:
      return state;

  }

  return newState;

}
```
|||

### Reimplementando el Componente Player

Ahora que Redux esta manejando nuestro estado y comportamiento, continuemos y conectemoslo a nuestro componente `Main` de nuestre app de React. Podemos hacer esto sin romper mucha de la funcionalidad en `Main` - a pesar que el estado de `Main` esta actualmente siendo manejado por React, podemos continuar y conectar nuestro store con la información que Redux maneja actualmente y lentamente refactorearlo para usar las props que Redux le va a pasar a él en cambio! Veamos como funciona:

- Actualiza el `constructor()` y el `componentDidMount()` de `Main` para combinar el estado del store con el estado inicial de `Main`. Asegurate de remover cualquier propiedad del estado inical que ahora va a reemplazar Redux!

+++Aproximación
Imita lo que hicimos con `LyricsContainer`. Usa `subscribe`, `getState`, `this.unsubscribe`, etc.
+++

- Importa tus action creators de `action-creators/player.js` y reemplazá el interior de cada método específico del Player en Main ej. `loadSong`, `start`, `play`.

|||
```js
  start(song, list) {
    store.dispatch(start(song, list))
  }

  play() {
    store.dispatch(play());
  }

  pause() {
    store.dispatch(pause());
  }

  next() {
    store.dispatch(next());
  }

  previous() {
    store.dispatch(next());
  }
```
|||

- Lentamente refactorea el método render del `Main` para usar la información del estado de Redux. Esto básicamente significa agregarle `.player` a `this.state`, ej. `this.state.currentSong` --> `this.state.playerCurrentSong`.


### Repita

Ahora que hemos hecho un ejemplo bastante fuerte, deberíamos tener todas las herramientas que necesitamos para migrar a Redux completamente! Esto es lo que le sigue faltando al store de Redux:

- Player Progress
- Todos los albumes
- Un album seleccionado
- Todos los artistas
- Un artista seleccionado
- Todas las playlists
- Una playlist seleccionada
- Todas las canciones (para ser usado solo para añadir canciones a la playlist, por ahora)

Estamos sacando las rueditas de ayuda por ahora, pero aquí hay una lista de pasos para guiarte. Probablemente necesites iterar de atras para adelante en varios pasos a medida que probás varias aproximaciones.

1. Usa los tipos de acciones en `constants.js` para dirijir tu trabajo.
2. Usa la funcionalidad actual de `Main` y métodos que no estan usando action creators como tus objetivos
3. Usa las porpiedades en el estado inicial de `Main` para planear tus nuevos sub-reducers.
4. Escribí action-creators que van a generalizar las acciones que queres dispatchear a tu store.
5. Escribí un sub reducer para cada grupo de la información del estado que describe como se va a actualizar en respuesta a una acción.
  - No te olvides de definir un valor por defecto para cada pedazo del estado y retornar el estado actual por defecto si la acción no matchea
  - También, estate **muy** seguro de mantener inmutabilidad en tu reducer. Si no estas seguro que estás haciendo esto correctamente, chequá [esta sección](https://redux.js.org/docs/recipes/reducers/ImmutableUpdatePatterns.html) de la documentación de Redux.
6. Agrega cada sub-reducer a el `combineReducer` llamado en `store.js`.
7. Manten en mente que, por nuestro sub-reducers, la forma de nuestro estado cambia un poco: Ahora tenemos `.player` y `.lyrics`, luego de más trabajo probablemente tengamos `.artists`, `.albums`, `.playlists`, `songs`. Componentes recibiendo props de `Main`estan esperando que las cosas sean mas "planas" y seguramente tengas que cambiar como le pasas las props a los componentes presentacionales para que se adhiera a esta nueva forma.

#### Destruyendo Main

Aun tenemos a nuestro `Main`, como el principal controlador de casi todo el manejo del estado y el dispatcheo de acciones. La centralización es buena, pero cuando hace a nuestro `Main` así de gordo, definitivamente vale la pena escribir más específicos contenedores inteligentes. Ahora esto es más fácil por nuestro estado global siendo controlado por Redux!

Debajo hay una lista de todos los contenedores. ¿Podes refactorear tu `AppContainer` y mover su fincionalidad a los componentes apropiados?

```
SelectSongContainer.jsx
AlbumContainer.jsx
AlbumsContainer.jsx
ArtistContainer.jsx
FilterableArtistsContainer.jsx
LyricsContainer.jsx
NewPlaylistContainer.jsx
PlayerContainer.jsx
PlaylistContainer.jsx
SidebarContainer.jsx
```

También podes aprovechar de mover los `componentDidMount` de los componentes presentacionales para cargar la data a los contenedores.