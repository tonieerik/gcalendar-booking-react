import React, { useState } from 'react';
import axios from 'axios';
import Datepicker from 'react-datepicker'

import './App.css';
import 'react-datepicker/dist/react-datepicker.css';

const objToStrMap = obj => {
  let strMap = new Map();
  for (let k of Object.keys(obj)) {
    strMap.set(k, obj[k]);
  }
  return strMap;
}

const renderSlots = slots => {
  const res = [];
  slots.forEach((activities, time) => res.push(
    <tr key={time}>
      <td>{time}</td>
      <td>{renderActivityButtons(time, activities)}</td>
    </tr>
  ));
  return res;
}

const renderActivityButtons = (time, activities) =>
  <span key={time}>
    {activities.includes(1) && <button>Köysilaskeutuminen</button>}
    {activities.includes(2) && <button>Siltakeinu</button>}
    {activities.includes(3) && <button>Kalliokiipeily</button>}
  </span>

const App = () => {
  const [freeSlots, setFreeSlots] = useState(null);
  const [startDate, setStartDate] = useState(new Date());

  const getFreeSlots = async () => {
    const res = await axios.get("https://gcalendar-booking.herokuapp.com/2019-09-27");
    setFreeSlots(objToStrMap(JSON.parse(res.data)));
  }

  const onDateSelect = date => {
    setStartDate(date);
    getFreeSlots();
  }

  return (
    <div className="App">
      <Datepicker
        dateFormat="d.M.yyyy"
        onChange={onDateSelect}
        selected={startDate} />
      <table>
        <tbody>
          {freeSlots && renderSlots(freeSlots)}
        </tbody>
      </table>
    </div>
  );
}

export default App;
