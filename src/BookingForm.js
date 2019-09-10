import React, { useState } from 'react';
import { Form, Field } from 'react-final-form'
import Select from 'react-select';
import axios from 'axios';
import moment from 'moment';
import { ACTIVITIES, DATE_FORMAT, DATE_FORMAT_PRINT } from './const';

const BookingForm = ({activity, date, maxAttendees, time, setIsLoading}) => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const options = [];
  for (let i = 1; i <= maxAttendees; i++) {
    options.push({ value: i, label: i });
  }

  const onSubmit = async values => {
    setError(null);
    setIsLoading(true);
    
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

  return (
    <>
      <h3>Lähetä ajanvarauspyyntö</h3>
      <div>Huom! Ajanvarauspyynnöt tarkistetaan aina käsin. Ellet saa vahvistusviestiä vuorokauden kuluessa, laita viestiä 0400 627 010.</div>
      <br />
      <div>Jos osallistujamäärä ei ole tarkka, merkkaa osallistujien maksimimäärä ja anna paras arviosi 'Huomioitavaa' -kenttään.</div>
      <br />
      <Form
        initialValues={{attendees: options[0]}}
        onSubmit={onSubmit}
        render={({ handleSubmit, form, submitting, pristine, values }) =>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Ajankohta</label>
              <span>{moment(date).format(DATE_FORMAT_PRINT)} klo {time}</span>
            </div>
            <div>
              <label>Elämys</label>
              <span>{ACTIVITIES.find(act => act.id === activity).title}</span>
            </div>
            <div>
              <label>Osallistujamäärä</label>
              <Field name="attendees">
                { props => <Select defaultValue={options[0]} options={options} onChange={props.input.onChange} value={props.input.value} /> }
              </Field>
            </div>
            <div>
              <label>Varaajan nimi</label>
              <Field
                name="name"
                component="input"
                type="text"
              />
            </div>
            <div>
              <label>Puhelinnumero</label>
              <Field
                name="phone"
                component="input"
                type="tel"
              />
            </div>
            <div>
              <label>Sähköposti</label>
              <Field
                name="email"
                component="input"
                type="email"
              />
            </div>
            <div>
              <label>Huomioitavaa</label>
              <Field
                name="note"
                component="textarea"
                type="note"
              />
            </div>
            <div>
              <button type="submit" disabled={submitting || pristine}>
                Lähetä
              </button>
            </div>
          </form>

        }
      />
      {
        error
          ? <div>{error}</div>
          : (result === 200 && <div>Kiitos varauspyynnöstä, muistathan kysyä ellet saa vahvistusta varaukseesi 24h sisään. Jos osallistujamäärä muuttuu, muistathan ilmoittaa toni@huvimestari.fi / 0400 627 010, koska muuten välttämättä jokainen ei ehdi osallistua!</div>)
      }
    </>
  );
}

export default BookingForm;
