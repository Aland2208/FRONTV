import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { addIcons } from 'ionicons';
import {
  star,
  save,
  saveOutline,
  alarm,
  add,
  addCircle,
  addCircleOutline,

  logoYoutube,

  home,
  homeOutline,
  pin,
  locationOutline,

  personOutline,
  personCircleOutline,
  personAddOutline,
  peopleOutline,
  idCardOutline,

  barChartOutline,
  statsChartOutline,
  analyticsOutline,
  pieChartOutline,
  trendingUpOutline,

  cubeOutline,
  cartOutline,
  bagHandleOutline,
  layersOutline,

  callOutline,
  mailOutline,

  logOut,
  logOutOutline,

  scanOutline,
  cameraOutline,

  documentTextOutline,
  documentOutline,
  documentsOutline,
  createOutline,

  timeOutline,
  calendarOutline,

  lockClosedOutline,
  lockOpenOutline,
  keyOutline,

  shieldCheckmarkOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  ellipseOutline,

  binocularsOutline,
  eyeOutline,
  eyeOffOutline,

  linkOutline,
  unlinkOutline,

  settingsOutline,

  closeOutline,
  closeCircleOutline,

  chevronForwardOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronUpOutline,

  arrowBackOutline,
  arrowForwardOutline,

  refreshOutline,
  searchOutline,
  filterOutline,

  informationCircleOutline,
  alertCircleOutline,
  warningOutline,

  downloadOutline,
  cloudDownloadOutline,

  pencilOutline,
  trashOutline,

  powerOutline,
  menuOutline,

  fishOutline,
  scaleOutline,

  listOutline,
  imagesOutline,
  imageOutline
} from 'ionicons/icons';

addIcons({
  'star': star,
  'save': save,
  'save-outline': saveOutline,
  'alarm': alarm,

  'add': add,
  'add-circle': addCircle,
  'add-circle-outline': addCircleOutline,

  'logo-youtube': logoYoutube,

  'home': home,
  'home-outline': homeOutline,
  'pin': pin,
  'location-outline': locationOutline,

  'person-outline': personOutline,
  'person-circle-outline': personCircleOutline,
  'person-add-outline': personAddOutline,
  'people-outline': peopleOutline,
  'id-card-outline': idCardOutline,

  'bar-chart-outline': barChartOutline,
  'stats-chart-outline': statsChartOutline,
  'analytics-outline': analyticsOutline,
  'pie-chart-outline': pieChartOutline,
  'trending-up-outline': trendingUpOutline,

  'cube-outline': cubeOutline,
  'cart-outline': cartOutline,
  'bag-handle-outline': bagHandleOutline,
  'layers-outline': layersOutline,

  'call-outline': callOutline,
  'mail-outline': mailOutline,

  'log-out': logOut,
  'log-out-outline': logOutOutline,

  'scan-outline': scanOutline,
  'camera-outline': cameraOutline,

  'document-text-outline': documentTextOutline,
  'document-outline': documentOutline,
  'documents-outline': documentsOutline,
  'create-outline': createOutline,

  'time-outline': timeOutline,
  'calendar-outline': calendarOutline,

  'lock-closed-outline': lockClosedOutline,
  'lock-open-outline': lockOpenOutline,
  'key-outline': keyOutline,

  'shield-checkmark-outline': shieldCheckmarkOutline,
  'checkmark-circle': checkmarkCircle,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'ellipse-outline': ellipseOutline,

  'binoculars-outline': binocularsOutline,
  'eye-outline': eyeOutline,
  'eye-off-outline': eyeOffOutline,

  'link-outline': linkOutline,
  'unlink-outline': unlinkOutline,

  'settings-outline': settingsOutline,

  'close-outline': closeOutline,
  'close-circle-outline': closeCircleOutline,

  'chevron-forward-outline': chevronForwardOutline,
  'chevron-back-outline': chevronBackOutline,
  'chevron-down-outline': chevronDownOutline,
  'chevron-up-outline': chevronUpOutline,

  'arrow-back-outline': arrowBackOutline,
  'arrow-forward-outline': arrowForwardOutline,

  'refresh-outline': refreshOutline,
  'search-outline': searchOutline,
  'filter-outline': filterOutline,

  'information-circle-outline': informationCircleOutline,
  'alert-circle-outline': alertCircleOutline,
  'warning-outline': warningOutline,

  'download-outline': downloadOutline,
  'cloud-download-outline': cloudDownloadOutline,

  'pencil-outline': pencilOutline,
  'trash-outline': trashOutline,

  'power-outline': powerOutline,
  'menu-outline': menuOutline,

  'fish-outline': fishOutline,
  'scale-outline': scaleOutline,

  'list-outline': listOutline,
  'images-outline': imagesOutline,
  'image-outline': imageOutline
});

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules))
  ]
});