import boto3
import json
import os
from decimal import Decimal

TABLE_NAME = os.getenv('ANALYTICS_TABLE')
DYNAMODB_CLIENT = boto3.client('dynamodb')


def lambda_handler(event, context):
    """
    Simple handler, scans the DynamoDB to retrieve all the items.

    :param event: Received from the API Gateway.
    :param context: Execution context.
    :return: The available items in DynamoDB.
    """
    response = DYNAMODB_CLIENT.scan(
        TableName=TABLE_NAME,
        Select='ALL_ATTRIBUTES',
        ConsistentRead=True
    )
    print(response['Items'])
    items = list()
    for item in response['Items']:
        new_item = dict()
        for key in item:
            if str(key).startswith('price_'):
                new_item[key] = float(item[key]['N'])
            elif key == 'instrument':
                new_item[key] = int(item[key]['N'])
            else:
                new_item[key] = item[key]
        items.append(new_item)
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(items)
    }
