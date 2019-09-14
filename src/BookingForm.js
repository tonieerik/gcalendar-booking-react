import React, { useState } from 'react';
import { Form, Field } from 'react-final-form'
import Select from 'react-select';
import axios from 'axios';
import moment from 'moment';
import { ACTIVITIES, ACTIVITY_RAPPELLING, ACTIVITY_PENDULUM, DATE_FORMAT, DATE_FORMAT_PRINT } from './const';

import './App.css';

const PRICES = [
  {id: ACTIVITY_RAPPELLING, basePrice: 150, personPrice: 30},
  {id: ACTIVITY_PENDULUM, basePrice: 100, personPrice: 25}
];

const BookingForm = ({activity, date, isSubmitted, maxAttendees, time, setDate, setIsLoading, setIsSubmitted}) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const options = [];
  for (let i = 1; i <= maxAttendees; i++) {
    options.push({ value: i, label: i });
  }

  const onSubmit = async values => {
    setDate(null);
    setError(null);
    setIsLoading(true);
    setIsSubmitted(true);
    
    const payload = {
      ...values,
      attendees: values.attendees ? values.attendees.value : undefined,
      activity: ACTIVITIES.find(act => act.id === activity).title,
      date: moment(date).format(DATE_FORMAT),
      time
    }

    try {
      const res = await axios.post("https://gcalendar-booking.herokuapp.com/create-booking", {payload});
      setResult(res.status);
      setIsLoading(false);
    } catch(e) {
      setError('Virhe varauspyyntöä lähettäessä, ole hyvä ja laita varaustietosi sähköpostitse toni@huvimestari.fi tai soita 0400 627 010. Ilmoitathan samalla virheestä, että voimme korjata sen ensitilassa!');
      setIsLoading(false);
    }
  }

  const customStylesForSelect = {
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#333333' : '#ffffff',
      borderBottom: '1px dotted #d0d0d0',
      color: state.isSelected ? '#ffffff' : '#333333',
      padding: 10,
    }),
    control: (provided) => ({
      ...provided,
      backgroundColor: '#ff7800',
      border: '1px solid #ffffff',
      borderRadius: '5px',
      width: '100%',
    }),
    singleValue: (provided, state) => {
      const opacity = state.isDisabled ? 0.5 : 1;
      const transition = 'opacity 300ms';
  
      return { ...provided, opacity, transition };
    }
  }

  const renderBookingForm = () =>
    <div className="bookingForm">
      <h3>Olet tekemässä varausta:</h3>
      <div className="bookingTitle">{ACTIVITIES.find(act => act.id === activity).title}, {moment(date).format(DATE_FORMAT_PRINT)} klo {time}</div>
      <Form
        initialValues={{attendees: options[0]}}
        onSubmit={onSubmit}
        render={({ handleSubmit, form, submitting, pristine, values }) =>
          <form onSubmit={handleSubmit}>
            <label>
              Osallistujamäärä
              <Field name="attendees">
                { props => <Select defaultValue={options[0]} options={options} onChange={props.input.onChange} styles={customStylesForSelect} value={props.input.value} /> }
              </Field>
            </label>
            <label>
              Varaajan nimi
              <Field
                name="name"
                component="input"
                type="text"
              />
            </label>
            <label>
              Puhelinnumero
              <Field
                name="phone"
                component="input"
                type="tel"
              />
            </label>
            <label>
              Sähköposti
              <Field
                name="email"
                component="input"
                type="email"
              />
            </label>
            <label>
              Huomioitavaa
              <Field
                name="note"
                component="textarea"
                placeholder="Jos osallistujamäärä ei ole tarkkaan tiedossa, merkkaa arvioitu maksimimäärä ja kirjoita tähän kuinka moni todennäköisesti osallistuu. Voit myös halutessasi kirjoittaa muita terveisiä ohjaajalle ennakkoon."
                type="note"
              />
            </label>
            <br />
            <div className="info"><b>Osallistujien mukaan arvioitu hinta: {(values && values.attendees ) ? (PRICES.find(x => x.id === activity).basePrice + (values.attendees.value-1) * PRICES.find(x => x.id === activity).personPrice) : '??'}&euro;</b><br />
            Veloitetaan paikan päällä (käteinen/kortti), toteutuneiden osallistujien mukaan (minimi: 1 hlö).</div>
            <div>
              <button type="submit" disabled={submitting || pristine}>
                L Ä H E T Ä
              </button>
            </div>
            <br /><br />
          </form>

        }
      />
    </div>

  if (isSubmitted) {
    return (
      error
        ? <div>{error}</div>
        : (result === 200 &&
          <div>
            <h3>Kiitos varauspyynnöstä!</h3>
            <p>Kaikki varauspyynnöt tarkistetaan ja vahvistetaan käsin, joten varausvahvistuksen saamisessa kestää aina jonkin aikaa.</p>
            <p><b>Laitathan kuitenkin viestiä</b> (0400 627 010 / toni@huvimestari.fi), <b>ellet saa</b> vuorokauden sisällä <b>vahvistusta sähköpostiisi.</b> Joskus vahvistusviesti voi joutua roskapostilaatikkoosi, joten tarkistathan myös sen.</p>
            <p>Jos osallistujamäärä muuttuu, muistathan ilmoittaa viestillä, koska muuten välttämättä jokainen ei ehdi osallistumaan! <b>Haluamme tarkan osallistujamääräarvion viimeistään viikkoa ennen tapahtumaa.</b></p>
          </div>
        )
    );
  } else {
    return (
      renderBookingForm()
    );
  }
}

export default BookingForm;
