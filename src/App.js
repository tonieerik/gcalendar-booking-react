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
  const [maxAttendees, setMaxAttendees] = useState(null);

  const renderSlotTable = () =>
    freeSlots && freeSlots.size > 0 && ! isLoading ? 
      <table>
        <tbody>
          { renderSlots() }
        </tbody>
      </table>
    : date && ! isLoading && <div>Ei vapaita aikoja valittuna päivänä</div>

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
    <span key={time}>
      { activities.includes(ACTIVITY_RAPPELLING) && <button onClick={() => onActivitySelect(time, ACTIVITY_RAPPELLING)}>Köysilaskeutuminen</button> }
      { activities.includes(ACTIVITY_PENDULUM) && <button onClick={() => onActivitySelect(time, ACTIVITY_PENDULUM)}>Siltakeinu</button> }
      { activities.includes(ACTIVITY_CLIMBING) && <button onClick={() => onActivitySelect(time, ACTIVITY_CLIMBING)}>Kalliokiipeily</button> }
    </span>

  const getFreeSlots = async (date) => {
    setIsLoading(true);
    const res = await axios.get("https://gcalendar-booking.herokuapp.com/free-slots/" + moment(date).format(DATE_FORMAT));
    setFreeSlots(objToStrMap(JSON.parse(res.data)));
    setIsLoading(false);
  }

  const onDateSelect = date => {
    setActivity(null);
    setMaxAttendees(null);
    setDate(date);
    getFreeSlots(date);
  }

  const onActivitySelect = (time, act) => {
    setTime(time);
    setActivity(act);

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
      <Datepicker
        dateFormat={DATE_FORMAT_DATEPICKER}
        onChange={onDateSelect}
        locale="fi"
        placeholderText="Valitse päivä"
        selected={date} />
      {
        activity
          ? <BookingForm activity={activity} date={date} maxAttendees={maxAttendees} time={time} setIsLoading={setIsLoading} />
          : renderSlotTable()
      }
      { isLoading && <div><br /><br /><Loader type="TailSpin" color="#FF7E00" height={60} width={60} /></div> }
    </div>
  );
}

export default App;
