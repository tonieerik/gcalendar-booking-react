import React, { useState } from 'react';
import axios from 'axios';
import Datepicker, { registerLocale } from 'react-datepicker';
import moment from 'moment';
import Loader from 'react-loader-spinner';
import fi from 'date-fns/locale/fi';
import BookingForm from './BookingForm';
import { ACTIVITY_CLIMBING, ACTIVITY_PENDULUM, ACTIVITY_RAPPELLING, DATE_FORMAT, DATE_FORMAT_DATEPICKER } from './const';

import './App.css';
import 'react-datepicker/dist/react-datepicker.css';
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

registerLocale("fi", fi);

const objToStrMap = obj => {
  let strMap = new Map();
  for (let k of Object.keys(obj)) {
    strMap.set(k, obj[k]);
  }
  return strMap;
}

const App = () => {
  const [freeSlots, setFreeSlots] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [activity, setActivity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState(null);
  const [error, setError] = useState(null);

  const renderSlotTable = () =>
    freeSlots && freeSlots.size > 0 && ! isLoading ? 
      <div>
        <div className="info">Valitsemasi päivän vapaat ajat ovat nähtävissä alla olevasta kalenterista. Klikkaa haluamaasi aktiviteettia ja pääset tekemään varauksen.</div>
        <table className="slotTable">
          <tbody>
            { renderSlots() }
          </tbody>
        </table>
      </div>
    : date && ! isLoading && (error ? <div><br />Virhe haettaessa kalenteritapahtumia</div> : <div>Ei vapaita aikoja valittuna päivänä</div>)

  const renderSlots = () => {
    const res = [];

    freeSlots.forEach((activities, time) => res.push(
      <tr key={time}>
        <td>{time}</td>
        <td>{renderActivityButtons(time, activities)}</td>
      </tr>
    ));

    return res;
  }
  
  const renderActivityButtons = (time, activities) =>
    <span key={time} className="timeSlotButtons">
      { activities.includes(ACTIVITY_RAPPELLING) && <button onClick={() => onActivitySelect(time, ACTIVITY_RAPPELLING)}>Köysilaskeutuminen</button> }
      { activities.includes(ACTIVITY_PENDULUM) && <button onClick={() => onActivitySelect(time, ACTIVITY_PENDULUM)}>Siltakeinu</button> }
      { activities.includes(ACTIVITY_CLIMBING) && <button onClick={() => onActivitySelect(time, ACTIVITY_CLIMBING)}>Kalliokiipeily</button> }
    </span>

  const getFreeSlots = async (date) => {
    if (! date) {
      setFreeSlots(null);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await axios.get("https://gcalendar-booking.herokuapp.com/free-slots/" + moment(date).format(DATE_FORMAT));
      setFreeSlots(objToStrMap(JSON.parse(res.data)));
      setIsLoading(false);
    } catch(e) {
      setError('Virhe haettaessa kalenteritapahtumia.');
      setIsLoading(false);
    }
  }

  const onDateSelect = date => {
    setActivity(null);
    setIsSubmitted(false);
    setMaxAttendees(null);
    setDate(date);
    getFreeSlots(date);
  }

  const onActivitySelect = (time, act) => {
    setTime(time);
    setActivity(act);
    window.scrollTo(0, 0);

    const [hour, min] = time.split('.');

    if (! hour || ! min) {
      console.error('onActivitySelect(): time split failed (hour: ' + hour + ', min: ' + min + ')');
    }

    let maxAttendees = 1;
    for (const m = moment().hour(hour).minute(min).add(15, 'minutes'); freeSlots.get(m.format('HH.mm')) && freeSlots.get(m.format('HH.mm')).includes(act); m.add(15, 'minutes')) {
      maxAttendees++;
    }
    setMaxAttendees(maxAttendees);
  }

  return (
    <div className="App">
      <h1>Huvimestarin varauskalenteri</h1>
      <b>Valitse päivämäärä: &nbsp;</b>
      <Datepicker
        dateFormat={DATE_FORMAT_DATEPICKER}
        onChange={onDateSelect}
        isClearable
        locale="fi"
        minDate={moment().add(1, 'day').toDate()}
        placeholderText=""
        selected={date} />
      {
        activity
          ? <BookingForm activity={activity} date={date} isSubmitted={isSubmitted} maxAttendees={maxAttendees} time={time} setDate={setDate} setIsLoading={setIsLoading} setIsSubmitted={setIsSubmitted} />
          : date ? renderSlotTable() : ''
      }
      { isLoading && <div><br /><br /><Loader type="TailSpin" color="#FF7E00" height={60} width={60} /></div> }
    </div>
  );
}

export default App;
