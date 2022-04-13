import { useRef } from 'react';
import './App.css';
import FormSelect from './components/formSelect/FormSelect';
import { Form } from '@unform/web';
import { FormHandles } from '@unform/core';
import AsyncFormSelect from './components/formSelect/AsyncFormSelect';

const options = [
  {
    label: 'Sergio Vago',
    value: '1'
  },
  {
    label: 'Isabella de Assis',
    value: '2'
  },
  {
    label: 'Dono 3',
    value: '3'
  },
  {
    label: 'Dono 4',
    value: '4'
  }
]


function App() {
  const formRef = useRef<FormHandles>(null)

  function functionThatResetsForm() {
    formRef?.current?.reset()

    formRef.current?.setErrors({
      owner_id: 'Teste de erro'
    })
  }

  function setOwner() {
    console.log('setting');
    const owners = formRef.current?.getFieldValue('owner_id')

    formRef.current?.setFieldValue('owner_id', [...owners, '1'])

    const async_owners = formRef.current?.getFieldValue('async_owner_id')

    formRef.current?.setFieldValue('async_owner_id', [...async_owners, '6225'])
  }

  function generateOptions(data: any) {
    return data.map((datum: any) => {
      return {
        label: datum.name,
        value: datum.id
      }
    })
  }

  return (
    <div className="App">
      <header className="App-header">
        <Form
          ref={formRef}
          initialData={{
            owner_id: ['3', '4'],
            async_owner_id: ['4208', '44110281'],
          }}
          onSubmit={(data) => { console.log('data :>> ', data); }}
        >
          <section>
            <label>Normal</label>
            <FormSelect name="owner_id" options={options} isClearable isMulti />
          </section>
          <section>
            <label>Async</label>
            <AsyncFormSelect name="async_owner_id" isClearable uri='people' isMulti generateOptions={generateOptions} />
          </section>

          <button type='submit'>Enviar</button>
          <button type='button' onClick={functionThatResetsForm}>Limpar</button>
          <button type='button' onClick={setOwner}>Adicionar dono</button>
        </Form>
      </header>
    </div>
  );
}

export default App;
