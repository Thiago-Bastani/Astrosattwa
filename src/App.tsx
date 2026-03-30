import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { planetOutline, bookOutline } from 'ionicons/icons';
import MandalaPage from './pages/MandalaPage';
import ReferencePage from './pages/ReferencePage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/mandala" component={MandalaPage} />
          <Route exact path="/referencia" component={ReferencePage} />
          <Redirect exact from="/" to="/mandala" />
        </IonRouterOutlet>
        <IonTabBar slot="bottom" style={{ '--background': '#000000', '--color': '#7f8c8d', '--color-selected': '#c9a84c' } as any}>
          <IonTabButton tab="mandala" href="/mandala">
            <IonIcon icon={planetOutline} />
            <IonLabel>Mapa</IonLabel>
          </IonTabButton>
          <IonTabButton tab="referencia" href="/referencia">
            <IonIcon icon={bookOutline} />
            <IonLabel>Referência</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
  </IonApp>
);

export default App;
