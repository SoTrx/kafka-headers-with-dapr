KAFKA_TOPIC=test
DAPR_COMPONENT=kafka-pubsub
PUBLISH_ID=pub

run-kafka:
	docker-compose up

# Publish an event in the appropriate kafka topic, with a "x-cat : miaou" header
publish:
	dapr run --app-id ${PUBLISH_ID} --resources-path ./components -- \
		dapr publish -t ${KAFKA_TOPIC} -p ${DAPR_COMPONENT} -i ${PUBLISH_ID} -d "{}" -m '{"X-cat": "miaou"}'

# See what's going on inside the targeted topic
tail-topic:
	docker run -it --network=host edenhill/kcat:1.7.1 -b 127.0.0.1:9092 -t ${KAFKA_TOPIC} -C -f '\nKey (%K bytes): %k\nValue (%S bytes): %s\nTimestamp: %T\nPartition: %p\nOffset: %o\nHeaders: %h\n'

# Build the node.js small test subscriber
build-sub:
	cd subscriber && [ -f ./node_modules/.bin/tsc ] && echo "node_modules installed " || npm install
	cd subscriber && ./node_modules/.bin/tsc && cd -

# Run the subscriber
run-sub: build-sub
	dapr run --app-id sub --resources-path ./components --app-port=3001 --dapr-http-port=3502 -- node subscriber/dist/app.js
