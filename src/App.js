import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import * as Tone from 'tone';
import { notes, stepSize } from './sources/notes';
import tau from './sources/tau';
import pi from './sources/pi';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Form from "react-bootstrap/Form";
import Display from "./components/Display";

function App() {
  const [source, setSource] = useState(pi);
  const [basePitch, setBasePitch] = useState('c');
  const [baseHertz, setBaseHertz] = useState(notes.c);
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState('');
  const [position, setPosition] = useState(0);

  const scale = [];
  let displayText = '';

  const updateText = newString => {
    displayText += newString;
    setText(displayText);
  }

  async function start() {
    await Tone.start();
    setIsPlaying(true);

    generateScale();
    const firstDigit = source.split('.')[0];
    const otherDigits = source.split('.')[1].split('');
    const digits = otherDigits.slice(0, 1000).map(digit => ({ digit, note: digitToHertz(digit) }));

    const synth = new Tone.Synth().toDestination();

    Tone.Transport.bpm.value = tempo;
    Tone.Transport.scheduleOnce(time => {
      synth.triggerAttackRelease(digitToHertz(firstDigit), "2n");
      Tone.Draw.schedule(() => {
        updateText(firstDigit);
      }, time);
      Tone.Draw.schedule(() => {
        updateText('.');
      }, time + Tone.TransportTime("2n").toSeconds());
    }, '0:0:0');

    let clockTime = 0;

    for (let [index, digit] of digits.entries()) {
      const noteDuration = '8n';
      digits[index].time = clockTime;
      clockTime += Tone.TransportTime(noteDuration).toSeconds();
      /*Tone.Transport.schedule(time => {
        synth.triggerAttackRelease(digit.note, noteDuration);
        Tone.Draw.schedule(() => {
          updateText(digit.digit);
        }, time);
        console.log(time);
      }, clockTime);
      clockTime += Tone.TransportTime(noteDuration).toSeconds();*/
    }

    const part = new Tone.Part(((time, value) => {
      synth.triggerAttackRelease(value.note, "8n", time);
      Tone.Draw.schedule(() => {
        updateText(value.digit);
      }, time);
    }), digits).start('1m');

    Tone.Transport.start();
  }

  function stop() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);
    scale.length = 0;
  }

  function generateScale() {
    for (let i = 0; i < 10; i++) {
      scale.push(centsToHertz(i * stepSize));
    }
  }

  function centsToHertz(cents) {
    return baseHertz * Math.pow(2, cents / 1200);
  }

  function digitToHertz(digit) {
    return scale[digit];
  }

  return (
    <Container fluid>
      <Row>
        <Col xs={6}>
          <Form>
            <fieldset disabled={isPlaying}>
              <Form.Group className="mb-3" controlId="source">
                <Form.Label>Source</Form.Label>
                <Form.Select onChange={e => setSource(e.target.value === 'tau' ? tau : pi)}>
                  <option value="pi" key="pi">Pi</option>
                  <option value="tau" key="tau">Tau</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3" controlId="basePitch">
                <Form.Label>Base Pitch</Form.Label>
                <Form.Select value={basePitch} onChange={e => {
                  setBasePitch(e.target.value);
                  setBaseHertz(notes[e.target.value]);
                }}>
                  {Object.keys(notes).map((note) =>
                    <option value={note} key={note}>
                      {note}
                    </option>
                  )}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3" controlId="tempo">
                <Form.Label>Tempo: {tempo}</Form.Label>
                <Form.Range min={30} max={200} value={tempo} onChange={e => setTempo(e.target.value)}/>
              </Form.Group>
            </fieldset>
          </Form>
          <Button variant="primary" onClick={ isPlaying ? stop : start }>
            { isPlaying ? 'Stop' : 'Play' }
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <Display text={text} position={position}></Display>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
