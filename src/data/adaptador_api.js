const axios = require('axios');

const BASE_URL = process.env.API_POWER_BASE_URL || 'https://power.larc.nasa.gov/api/temporal/daily/point';
const TIMEOUT = parseInt(process.env.API_POWER_TIMEOUT) || 5000;

class AdaptadorAPI {

  static async consultarET0(latitud, longitud, fechaInicio, fechaFin) {
    const r = await this.consultarDatosCompletos(latitud, longitud, fechaInicio, fechaFin);
    return r.et0;
  }

  static async consultarDatosCompletos(latitud, longitud, fechaInicio, fechaFin) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await axios.get(BASE_URL, {
        params: {
          parameters: 'PRECTOTCORR,T2M,T2M_MAX,T2M_MIN',
          community: 'AG',
          longitude: Number(longitud).toFixed(4),
          latitude: Number(latitud).toFixed(4),
          start: fechaInicio,
          end: fechaFin,
          format: 'JSON'
        },
        signal: controller.signal,
        timeout: TIMEOUT
      });

      clearTimeout(timeoutId);
      const data = response.data;
      let et0 = this.calcularET0PorDefecto();
      let precipitacion = 0;
      let temperaturaMedia = 20;
      let condicion = 'normal';

      if (data && data.properties && data.properties.parameter) {
        const prec = data.properties.parameter.PRECTOTCORR;
        if (prec && typeof prec === 'object') {
          const fechas = Object.keys(prec).filter(f => prec[f] !== -999 && prec[f] != null);
          if (fechas.length > 0) {
            const totalPrec = fechas.reduce((sum, f) => sum + Math.max(0, Number(prec[f])), 0);
            precipitacion = Number(totalPrec.toFixed(2));
          }
        }

        const temp = data.properties.parameter.T2M;
        if (temp && typeof temp === 'object') {
          const fechas = Object.keys(temp).filter(f => temp[f] !== -999 && temp[f] != null);
          if (fechas.length > 0) {
            const vals = fechas.map(f => Number(temp[f]));
            temperaturaMedia = vals.reduce((s, v) => s + v, 0) / vals.length;
          }
        }

        const tempMax = data.properties.parameter.T2M_MAX;
        const tempMin = data.properties.parameter.T2M_MIN;
        let tempMaxVal = temperaturaMedia, tempMinVal = temperaturaMedia;
        if (tempMax && typeof tempMax === 'object') {
          const f = Object.keys(tempMax).filter(f => tempMax[f] !== -999);
          if (f.length > 0) tempMaxVal = Number(tempMax[f[f.length - 1]]);
        }
        if (tempMin && typeof tempMin === 'object') {
          const f = Object.keys(tempMin).filter(f => tempMin[f] !== -999);
          if (f.length > 0) tempMinVal = Number(tempMin[f[f.length - 1]]);
        }

        const difTemp = tempMaxVal - tempMinVal;
        let usoTemp = false;
        if (difTemp > 0 && temperaturaMedia > 0) {
          et0 = this.calcularET0Hargreaves(latitud, tempMaxVal, tempMinVal, temperaturaMedia, fechaFin);
          usoTemp = true;
        }

        if (usoTemp) {
          if (et0 < 2.0) condicion = 'nublado';
          else if (et0 > 5.5) condicion = 'soleado';
          else condicion = 'normal';
        } else {
          if (temperaturaMedia < 5) {
            condicion = 'frio';
            et0 = Number((et0 * 0.5).toFixed(2));
          } else if (precipitacion > 5) {
            condicion = 'lluvia';
            et0 = Number((et0 * 0.6).toFixed(2));
          } else if (temperaturaMedia > 30) {
            condicion = 'calor';
            et0 = Number((et0 * 1.2).toFixed(2));
          } else if (et0 < 3.0) {
            condicion = 'nublado';
          } else if (et0 > 6.0) {
            condicion = 'soleado';
          }
        }
      }

      return { et0, precipitacion, temperatura: Number(temperaturaMedia.toFixed(1)), condicion };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        console.warn('Timeout al consultar API NASA POWER');
      } else {
        console.warn('Error al consultar API NASA POWER:', error.message);
      }
      return { et0: this.calcularET0PorDefecto(), precipitacion: 0, temperatura: 20, condicion: 'normal' };
    }
  }

  static calcularRa(latitud, fechaStr) {
    const anio = Number(String(fechaStr).slice(0, 4));
    const mes = Number(String(fechaStr).slice(4, 6));
    const dia = Number(String(fechaStr).slice(6, 8));
    const J = Math.ceil(275 * mes / 9 - 30 + dia) - 2;
    const phi = latitud * Math.PI / 180;
    const dr = 1 + 0.033 * Math.cos(2 * Math.PI * J / 365);
    const delta = 0.409 * Math.sin(2 * Math.PI * J / 365 - 1.39);
    const ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(delta))));
    const ra = (24 * 60 / Math.PI) * 0.0820 * dr * (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
    return Number(ra.toFixed(4));
  }

  static calcularET0Hargreaves(latitud, tmax, tmin, tmedia, fechaStr) {
    const ra = this.calcularRa(latitud, fechaStr);
    const raMm = ra / 2.45;
    const difTemp = Math.max(tmax - tmin, 1);
    const eto = 0.0023 * raMm * Math.sqrt(difTemp) * (tmedia + 17.8);
    return Number(Math.min(Math.max(eto, 0.5), 8.0).toFixed(2));
  }

  static calcularET0PorDefecto() {
    return Number((4.5 + (Math.random() * 2 - 1)).toFixed(2));
  }

  static async probarConexion() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      await axios.get(BASE_URL, {
        params: {
          parameters: 'ALLSKY_SFC_SW_DWN,PRECTOTCORR,T2M',
          community: 'AG',
          longitude: -99.1333,
          latitude: 19.4326,
          start: 20240101,
          end: 20240102,
          format: 'JSON'
        },
        signal: controller.signal,
        timeout: TIMEOUT
      });
      clearTimeout(timeoutId);
      return true;
    } catch {
      clearTimeout(timeoutId);
      return false;
    }
  }
}

module.exports = AdaptadorAPI;
