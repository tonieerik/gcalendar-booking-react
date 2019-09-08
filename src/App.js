import React, { useState } from 'react';
import Select from 'react-select';
import axios from 'axios';
import Datepicker, { registerLocale } from 'react-datepicker';
import moment from 'moment';
import Loader from 'react-loader-spinner'
import fi from 'date-fns/locale/fi'

import './App.css';
import 'react-datepicker/dist/react-datepicker.css';
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

registerLocale("fi", fi);

const ACTIVITY_RAPPELLING = 1
const ACTIVITY_PENDULUM = 2
const ACTIVITY_CLIMBING = 3

const ACTIVITIES = [
  {id: ACTIVITY_RAPPELLING, title: 'Köysilaskeutuminen'},
  {id: ACTIVITY_PENDULUM, title: 'Siltakeinu'},
  {id: ACTIVITY_CLIMBING, title: 'Kalliokiipeily'}
]

const BookingForm = ({activity, date, maxAttendees, time, setIsLoading}) => {
  const options = [];
  for (let i = 1; i <= maxAttendees; i++) {
    options.push({ value: i, label: i });
  }

  const [attendees, setAttendees] = useState(options[0]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);

  const onSend = async () => {
    setIsLoading(true);
    
    const data = {
      activity: ACTIVITIES.find(act => act.id === activity).title,
      date: moment(date).format('YYYY-MM-DD'),
      time,
      attendees,
      name,
      phone,
      email,
      note
    }
    const res = await axios.post("https://gcalendar-booking.herokuapp.com/create-booking", {data});
    setResult(res.status);

    setIsLoading(false);
  }

  return (
    <center>
      <h3>Lähetä ajanvarauspyyntö</h3>
      <div>Huom! Ajanvarauspyynnöt tarkistetaan aina käsin. Ellet saa vahvistusviestiä vuorokauden kuluessa, laita viestiä 0400 627 010.</div>
      <br />
      <div>Jos osallistujamäärä ei ole tarkka, merkkaa osallistujien maksimimäärä ja anna paras arviosi 'Huomioitavaa' -kenttään.</div>
      <br />
      <table><tbody>
        <tr><td><b>Ajankohta</b></td><td>{moment(date).format("D.M.YYYY")} klo {time}</td></tr>
        <tr><td><b>Elämys</b></td><td>{ACTIVITIES.find(act => act.id === activity).title}</td></tr>
        <tr><td><b>Osallistujamäärä</b></td><td><Select defaultValue={options[0]} options={options} onChange={value => setAttendees(value)} value={attendees} /> (ei sis. sivustakatsojia)</td></tr>
        <tr><td><b>Varaajan nimi</b></td><td><input onChange={e => setName(e.target.value)} type="text" value={name} /></td></tr>
        <tr><td><b>Puhelinnumero</b></td><td><input onChange={e => setPhone(e.target.value)} type="tel" value={phone} /></td></tr>
        <tr><td><b>Sähköposti</b></td><td><input onChange={e => setEmail(e.target.value)} type="email" value={email} /></td></tr>
        <tr><td><b>Huomioitavaa</b></td><td><textarea onChange={e => setNote(e.target.value)} value={note}></textarea></td></tr>
      </tbody></table>
      <div><input type="button" onClick={() => onSend()} value="Lähetä varauspyyntö" /></div>
      { result && ( result === 200 ? <div>Kiitos varauspyynnöstä, muistathan kysyä ellet saa vahvistusta varaukseesi 24h sisään.</div> : <div>Nyt meni jotain pieleen. Kokeiletko uudestaan ja ellei onnistu, laita viestiä toni@huvimestari.fi / 0400 627 010</div> ) }
    </center>
  )
}

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
    const res = await axios.get("https://gcalendar-booking.herokuapp.com/free-slots/" + moment(date).format("YYYY-MM-DD"));
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
        dateFormat="d.M.yyyy"
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
