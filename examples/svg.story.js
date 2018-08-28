import { storiesOf } from 'modulor-storybook';

import * as MHTML from '../';

const { html, render } = MHTML;



storiesOf('Svg')
  .add('svg clock', () => (container) => {

    const rowsCount = 30;
    const colsCount = 30;

    const styles = {
      container: {
        'display': 'inline-block',
        'position': 'relative',
        'width': '20%',
        'paddingBottom': '100%',
        'verticalAlign': 'middle',
        'overflow': 'hidden',
      },
      face: {
        'strokeWidth': '1px',
        'stroke': '#fff',
        'stroke': '#333',
        'fill': 'none',
      },
      arrow: {
        'strokeWidth': '1px',
        'fill': '#333',
        'stroke': '#555',
      },
      secArrow: {
        'stroke': '#f55',
      }
    };

    styles.secArrow = Object.assign({}, styles.arrow, styles.secArrow);


    const tpl = (date, styles) => html`
      <div id="clock-container" style="${styles.container}">
        <svg id="clock" viewBox="0 0 100 100">
          <circle id="face" cx="50" cy="50" r="45" style="${styles.face}"/>
          <g id="hands">
            <rect style="${styles.arrow}" id="hour"
                  x="47.5" y="12.5" width="5" height="40"
                  rx="2.5" ry="2.55"
                  transform="rotate(${30 * (date.getHours() % 12) + date.getMinutes() / 2} 50 50)" />

            <rect style="${styles.arrow}" id="min"
                  x="48.5" y="12.5" width="3" height="40"
                  rx="2" ry="2"
                  transform="rotate(${date.getMinutes() * 6} 50 50)" />
            <line style="${styles.secArrow}" id="sec"
                  x1="50" y1="50" x2="50" y2="16"
                  transform="rotate(${date.getSeconds() * 6} 50 50)" />
          </g>
        </svg>
      </div>
    `;


    setInterval(() => {
      render(tpl(new Date(), styles), container);
    }, 1000);
  })
