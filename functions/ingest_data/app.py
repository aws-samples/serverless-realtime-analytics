import base64
import boto3
import os
from botocore.exceptions import ClientError
from decimal import *

TABLE_NAME = os.getenv('ANALYTICS_TABLE')
DYNAMODB_CLIENT = boto3.client('dynamodb')


def lambda_handler(event, context):
    """
    Lambda handler, process the records in a Kinesis Stream and updates the DynamoDB table.

    :param event: Received by the lambda.
    :param context: Execution context.
    :return: Ok string.
    """
    for record in event['Records']:
        data = str(base64.b64decode(record['kinesis']['data'])).replace("'", '').replace('\\n', '').replace('"', '')
        print(data)
        item = extract_data(data)
        key = {'instrument': {'N': str(item['instrument'])}}
        del item['instrument']
        exp, values = create_expression_values(item)
        try:
            outcome = DYNAMODB_CLIENT.update_item(
                TableName=TABLE_NAME,
                Key=key,
                UpdateExpression=exp,
                ExpressionAttributeValues=values
            )
            print(outcome)
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                print("Ignoring message out of sync: ")
                print(e.response['Error'])
            else:
                raise e
    return "Ok"


def extract_data(data: str):
    """
    Extracts the data from the String, splits the fields by | and then gets the name before the = and value.

    :param data: The string to parse.
    :return: Dictionary with the parsed data.
    """
    fields = data.split('|')
    item = dict()
    for field in fields:
        if len(field) > 3:
            name_value = field.split('=')
            name = name_value[0]
            value = name_value[1]
            if name.startswith('price_'):
                item[name] = Decimal(str(int(value) / 100))
            elif name == 'instrument' or name == 'reception':
                item[name] = int(value)
            elif name == 'sequence':
                item['seq'] = int(value)
            elif name == 'type':
                item['t'] = int(value)
            elif name == 'level':
                item['l'] = int(value)
            else:
                item[name] = value
    return item


def create_expression_values(item: dict):
    """
    Creates the update expression using the provided dictionary.

    :param item: Dictionary of the data to use for the expression.
    :return: String with the expression.
    """
    expression = 'SET '
    values = dict()
    for name in item:
        expression += '{} = :{}, '.format(name, name)
        values[':{}'.format(name)] = {'S' if type(item[name]) is str else 'N': str(item[name])}
    return expression[0:-2], values
