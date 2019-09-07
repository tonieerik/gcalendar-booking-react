import React, { useState } from 'react';
import axios from 'axios';
import Datepicker, { registerLocale } from 'react-datepicker';
import moment from 'moment';
import fi from 'date-fns/locale/fi'

import './App.css';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale("fi", fi);

const ACTIVITY_RAPPELLING = 1
const ACTIVITY_PENDULUM = 2
const ACTIVITY_CLIMBING = 3

const ACTIVITY = [
  {id: ACTIVITY_RAPPELLING, title: 'Köysilaskeutuminen'},
  {id: ACTIVITY_PENDULUM, title: 'Siltakeinu'},
  {id: ACTIVITY_CLIMBING, title: 'Kalliokiipeily'}
]

const objToStrMap = obj => {
  let strMap = new Map();
  for (let k of Object.keys(obj)) {
    strMap.set(k, obj[k]);
  }
  return strMap;
}

const BookingForm = ({activity, date, time}) => {
  return (
    <center>
      <h3>Lähetä ajanvarauspyyntö</h3>
      <div>Huom! Ajanvarauspyynnöt tarkistetaan aina käsin. Ellet saa vahvistusviestiä vuorokauden kuluessa, laita viestiä 0400 627 010.</div>
      <br />
      <div>Jos osallistujamäärä ei ole tarkka, merkkaa osallistujien maksimimäärä ja anna paras arviosi 'Huomioitavaa' -kenttään.</div>
      <br />
      <table><tbody>
        <tr><td><b>Ajankohta</b></td><td>{moment(date).format("D.M.YYYY")} klo {time}</td></tr>
        <tr><td><b>Elämys</b></td><td>{ACTIVITY.find(act => act.id === activity).title}</td></tr>
        <tr><td><b>Osallistujamäärä</b></td><td>- (ei sis. sivustakatsojia)</td></tr>
        <tr><td><b>Varaajan nimi</b></td><td><input type="text" value="Elmeri Eerikkälä" /></td></tr>
        <tr><td><b>Puhelinnumero</b></td><td><input type="tel" value="040 123 4567" /></td></tr>
        <tr><td><b>Sähköposti</b></td><td><input type="email" value="sposti@posti.fi" /></td></tr>
        <tr><td><b>Huomioitavaa</b></td><td><textarea placeholder=""></textarea></td></tr>
      </tbody></table>
    </center>
  )
}

const App = () => {
  const [freeSlots, setFreeSlots] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [activity, setActivity] = useState(null);

  const renderSlotTable = () =>
    freeSlots && freeSlots.size > 0 ? 
      <table>
        <tbody>
          { renderSlots(freeSlots) }
        </tbody>
      </table>
    : date && <div>Ei vapaita aikoja valittuna päivänä</div>

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
      { activities.includes(ACTIVITY_RAPPELLING) && <button onClick={() => onActivitySelect(time, ACTIVITY_RAPPELLING)}>Köysilaskeutuminen</button> }
      { activities.includes(ACTIVITY_PENDULUM) && <button onClick={() => onActivitySelect(time, ACTIVITY_PENDULUM)}>Siltakeinu</button> }
      { activities.includes(ACTIVITY_CLIMBING) && <button onClick={() => onActivitySelect(time, ACTIVITY_CLIMBING)}>Kalliokiipeily</button> }
    </span>

  const getFreeSlots = async (date) => {
    const res = await axios.get("https://gcalendar-booking.herokuapp.com/" + moment(date).format("YYYY-MM-DD"));
    setFreeSlots(objToStrMap(JSON.parse(res.data)));
  }

  const onDateSelect = date => {
    setActivity(null);
    setDate(date);
    getFreeSlots(date);
  }

  const onActivitySelect = (time, act) => {
    setTime(time);
    setActivity(act);
  }

  return (
    <div className="App">
      <Datepicker
        dateFormat="d.M.yyyy"
        onChange={onDateSelect}
        locale="fi"
        placeholderText="Valitse päivä"
        selected={date} />
      { activity ? <BookingForm activity={activity} date={date} time={time} /> : renderSlotTable() }
    </div>
  );
}

export default App;
