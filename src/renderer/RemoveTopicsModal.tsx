import React, { FormEvent, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap';

type Props = {show: boolean, topics: string[], onRemoveTopics: (topics: string[]) => void, onClose: () => void}

const RemoveTopicsModal = (props: Props) => {
    const [validated, setValidated] = useState<boolean>(false);
    const [canSubmit, setCanSubmit] = useState<boolean>(true);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const form = event.currentTarget;
        if (form.checkValidity()) {
            props.onRemoveTopics(props.topics);
        } else {
            setCanSubmit(false);
            setValidated(true);
        }
    }

    const onFormChange = (event: FormEvent<HTMLFormElement>) => {
        if (!validated) {
            return;
        }
        const form : HTMLFormElement = event.currentTarget;
        setCanSubmit(form.checkValidity());
    }

    if (!props.show) return null;

    return <Modal show={props.show} onHide={props.onClose}>
        <Modal.Header closeButton>
            <Modal.Title>Delete Topic{props.topics.length > 1 ? "s" : null}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form id="add-topic-modal-form" noValidate validated={validated} onChange={onFormChange} onSubmit={handleSubmit}>
                {props.topics.map(t => <Form.Group className="mb-3" controlId="topicName">
                        <Form.Check type="checkbox"
                            name={t}
                            label={t}
                            defaultChecked={false}
                            required />
                    </Form.Group>
                )}
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={props.onClose}>
                Close
            </Button>
            <Button type="submit" variant="primary" form="add-topic-modal-form" disabled={!canSubmit}>
                Confirm deletion
            </Button>
        </Modal.Footer>
    </Modal>
}

export default RemoveTopicsModal