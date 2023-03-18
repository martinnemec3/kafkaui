import React, { useState, FormEvent } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap"
import { CreateTopicData, ClusterInfo } from "../types/types";


type Props = {show: boolean, clusterInfo: ClusterInfo, onAddTopic: (data: CreateTopicData) => void, onClose: () => void}

const AddTopicModal = (props: Props) => {

    const [validated, setValidated] = useState<boolean>(false);
    const [canSubmit, setCanSubmit] = useState<boolean>(true);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const form = event.currentTarget;
        const data = new FormData(form);
        setCanSubmit(false);
        if (form.checkValidity()) {
            props.onAddTopic({
                name: data.get("topicName").toString(),
                partitions: /\d+/.test(data.get("partitions").toString()) ? Number(data.get("partitions").toString()) : undefined,
                replicationFactor: /\d+/.test(data.get("replicationFactor").toString()) ? Number(data.get("replicationFactor").toString()) : undefined
            });
        } else {
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
            <Modal.Title>Create Topic</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form id="add-topic-modal-form" noValidate validated={validated} onChange={onFormChange} onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="topicName">
                    <Form.Label>Topic name</Form.Label>
                    <Form.Control name="topicName"
                        type="text"
                        placeholder="Topic name"
                        autoFocus
                        pattern="[a-zA-Z0-9\\._\\-]{1,255}"
                        required />
                    <Form.Control.Feedback type="invalid">
                        Invalid topic name.
                    </Form.Control.Feedback>
                </Form.Group>
                <Row className="mb-3">
                    <Form.Group as={Col} controlId="partitions">
                        <Form.Label>Partitions</Form.Label>
                        <Form.Control name="partitions"
                            type="number"
                            placeholder="No. of partitions"
                            min={1}
                            max={200000}
                        />
                        <Form.Control.Feedback type="invalid">
                            Invalid number of partitions.
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group as={Col} controlId="replicationFactor">
                        <Form.Label>Replication Factor</Form.Label>
                        <Form.Control name="replicationFactor"
                            type="number"
                            placeholder="No. of replicas"
                            min={0}
                            max={props.clusterInfo.brokers.length}
                        />
                        <Form.Control.Feedback type="invalid">
                            Invalid replication factor value.
                        </Form.Control.Feedback>
                    </Form.Group>
                </Row>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={props.onClose}>
                Close
            </Button>
            <Button type="submit" variant="primary" form="add-topic-modal-form" disabled={!canSubmit}>
                Confirm creation
            </Button>
        </Modal.Footer>
    </Modal>
}

export default AddTopicModal;