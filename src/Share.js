import {
  Box,
  Button,
  Form,
  FormField,
  Grid,
  Heading,
  Layer,
  MaskedInput,
  Paragraph,
  Text,
  TextInput,
} from 'grommet';
import { Close, CloudUpload, Copy } from 'grommet-icons';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import { apiUrl } from './slide';

const Summary = ({ Icon, label, guidance }) => (
  <Box align="center" gap="small" margin={{ top: 'medium' }}>
    <Icon size="large" />
    <Heading level={3} margin="none">
      {label}
    </Heading>
    <Paragraph textAlign="center">{guidance}</Paragraph>
  </Box>
);

const Publish = ({ set, onChange }) => {
  const [publication, setPublication] = useState({ email: '', pin: '' });
  const [publishing, setPublishing] = useState();
  const [uploadUrl, setUploadUrl] = useState();
  const [message, setMessage] = useState();
  const [error, setError] = useState();
  const inputRef = useRef();

  useEffect(() => {
    let stored = localStorage.getItem(`${set.name}--identity`);
    if (stored) {
      const identity = JSON.parse(stored);
      setPublication({ ...identity, name: set.name });
    } else {
      stored = localStorage.getItem('identity');
      if (stored) {
        const identity = JSON.parse(stored);
        setPublication({ ...identity, name: set.name });
      } else {
        setPublication({ name: set.name });
      }
    }
  }, [set]);

  const onPublish = ({ value: { email, pin } }) => {
    setPublishing(true);
    // remember email and pin in local storage so we can use later
    localStorage.setItem(
      `${set.name}--identity`,
      JSON.stringify({ email, pin }),
    );

    // add some metadata to the design
    const nextSet = JSON.parse(JSON.stringify(set));
    nextSet.email = email;
    const date = new Date();
    date.setMilliseconds(pin);
    nextSet.date = date.toISOString();
    delete nextSet.local;

    const body = JSON.stringify(nextSet);
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Content-Length': body.length,
      },
      body,
    })
      .then((response) => {
        if (response.ok) {
          setError(undefined);
          return response.text().then((id) => {
            const nextUploadUrl = [
              window.location.protocol,
              '//',
              window.location.host,
              window.location.pathname,
              `?id=${encodeURIComponent(id)}`,
              window.location.hash,
            ].join('');
            setUploadUrl(nextUploadUrl);
            nextSet.publishedUrl = nextUploadUrl;
            nextSet.id = id;
            nextSet.local = true;
            onChange(nextSet);
          });
        }
        return response.text().then(setError);
      })
      .catch((e) => setError(e.message))
      .then(() => setPublishing(false));
  };

  const onCopy = () => {
    inputRef.current.select();
    document.execCommand('copy');
    setMessage('copied to clipboard!');
  };

  return (
    <Box flex={false}>
      <Summary
        Icon={CloudUpload}
        label="Publish"
        guidance={`
        Publishing your design will generate a URL
        that you can send to others so they can see it.
        We use your email and PIN # so nobody else can modify your copy.
        They will be able to create their own design based on it.
      `}
      />
      <Form value={publication} onChange={setPublication} onSubmit={onPublish}>
        <FormField
          name="email"
          label="Email"
          required
          validate={{ regexp: /\w+@\w+\.\w+/ }}
        >
          <TextInput name="email" />
        </FormField>
        <FormField
          name="pin"
          label="PIN"
          required
          validate={{ regexp: /\d{3}/, message: 'three digits' }}
          error={error}
        >
          <MaskedInput
            name="pin"
            type="password"
            mask={[
              {
                length: 3,
                regexp: /^\d{1,3}$/,
                placeholder: '###',
              },
            ]}
          />
        </FormField>
        <Box align="center" margin={{ top: 'medium' }}>
          <Button type="submit" label="Publish" disabled={publishing} />
        </Box>
      </Form>
      {uploadUrl && (
        <Fragment>
          <Box direction="row" margin={{ top: 'medium' }}>
            <TextInput ref={inputRef} value={uploadUrl} />
            <Button
              icon={<Copy />}
              title="Copy URL"
              hoverIndicator
              onClick={onCopy}
            />
          </Box>
          <Box>
            <Text textAlign="end">{message}&nbsp;</Text>
          </Box>
        </Fragment>
      )}
      {set.date && (
        <Box margin={{ top: 'medium' }}>
          <Text size="small" color="text-xweak">
            Last published {new Date(set.date).toLocaleString()}
          </Text>
          {set.publishedUrl && (
            <Text size="small" color="text-xweak">
              {set.publishedUrl}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

const Share = ({ set, onChange, onClose }) => {
  return (
    <Layer position="top" margin="large" onEsc={onClose}>
      <Box background={{ color: 'background', dark: true }}>
        <Box direction="row" align="center" justify="between">
          <Button icon={<Close />} hoverIndicator onClick={onClose} />
          <Heading
            level={2}
            size="small"
            margin={{ horizontal: 'medium', vertical: 'none' }}
          >
            share
          </Heading>
        </Box>
        <Box
          flex
          pad={{ horizontal: 'large', bottom: 'large' }}
          overflow="auto"
        >
          <Grid
            fill="horizontal"
            columns={{ count: 'fit', size: 'small' }}
            gap="large"
          >
            <Publish set={set} onChange={onChange} />
          </Grid>
        </Box>
      </Box>
    </Layer>
  );
};

export default Share;
