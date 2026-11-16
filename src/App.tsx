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
import { planetOutline, bookOutline, calculatorOutline } from 'ionicons/icons';
import MandalaPage from './pages/MandalaPage';
import ReferencePage from './pages/ReferencePage';
import CalculatorPage from './pages/CalculatorPage';
import { DayThemeProvider } from './theme/DayTheme';
import ThemeRouteSync from './theme/ThemeRouteSync';
import { DeviceLocationProvider } from './services/DeviceLocation';

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
import './theme/layout.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <DeviceLocationProvider>
    <DayThemeProvider>
    <IonReactRouter>
      <ThemeRouteSync />
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/mandala" component={MandalaPage} />
          <Route exact path="/referencia" component={ReferencePage} />
          <Route exact path="/calculadora" component={CalculatorPage} />
          <Redirect exact from="/" to="/mandala" />
        </IonRouterOutlet>
        <IonTabBar slot="bottom" className="app-tabbar">
          <IonTabButton tab="mandala" href="/mandala">
            <IonIcon icon={planetOutline} />
            <IonLabel>Mapa</IonLabel>
          </IonTabButton>
          <IonTabButton tab="referencia" href="/referencia">
            <IonIcon icon={bookOutline} />
            <IonLabel>Referência</IonLabel>
          </IonTabButton>
          <IonTabButton tab="calculadora" href="/calculadora">
            <IonIcon icon={calculatorOutline} />
            <IonLabel>Calculadora</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </IonReactRouter>
    </DayThemeProvider>
    </DeviceLocationProvider>
  </IonApp>
);

export default App;
